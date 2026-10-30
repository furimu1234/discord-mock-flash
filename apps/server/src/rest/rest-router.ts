// apps/server/src/rest/rest-router.ts
import http from 'node:http';
import { StateStore } from '../state/store.js';
import { GatewayServer } from '../gateway/gateway-server.js';
import { Message, User, ChannelType, InteractionType, ComponentType } from '../types.js';

export class RestRouter {
  private store: StateStore;
  private gateway: GatewayServer;
  private port: number;

  constructor(store: StateStore, gateway: GatewayServer, port: number) {
    this.store = store;
    this.gateway = gateway;
    this.port = port;
  }

  public async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method || 'GET';

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return true;
    }

    // -------------------------------------------------------------
    // Discord Official REST API (v10) Emulation
    // -------------------------------------------------------------

    // 1. /api/v10/gateway/bot (Botが起動時に最初に叩くエンドポイント)
    if (pathname === '/api/v10/gateway/bot' && method === 'GET') {
      this.sendJson(res, 200, {
        url: `ws://127.0.0.1:${this.port}/gateway`,
        shards: 1,
        session_start_limit: {
          total: 1000,
          remaining: 999,
          reset_after: 14400000,
          max_concurrency: 1,
        },
      });
      return true;
    }

    // 2. /api/v10/users/@me (Bot自身のユーザー情報取得)
    if (pathname === '/api/v10/users/@me' && method === 'GET') {
      const state = this.store.getState();
      const botUser = state.users.find((u) => u.bot) || state.users[0];
      this.sendJson(res, 200, botUser);
      return true;
    }

    // 3. /api/v10/guilds/:guildId/channels
    const guildChannelsMatch = pathname.match(/^\/api\/v10\/guilds\/([^/]+)\/channels$/);
    if (guildChannelsMatch && method === 'GET') {
      const guildId = guildChannelsMatch[1];
      const channels = this.store.getState().channels.filter((c) => c.guild_id === guildId);
      this.sendJson(res, 200, channels);
      return true;
    }

    // 4. /api/v10/channels/:channelId/messages (メッセージ送信 & 履歴取得)
    const channelMessagesMatch = pathname.match(/^\/api\/v10\/channels\/([^/]+)\/messages$/);
    if (channelMessagesMatch) {
      const channelId = channelMessagesMatch[1];

      if (method === 'GET') {
        const msgs = this.store.getState().messages.filter((m) => m.channel_id === channelId);
        this.sendJson(res, 200, msgs.slice(-50));
        return true;
      }

      if (method === 'POST') {
        const body = await this.readBody(req);
        const state = this.store.getState();
        const botUser = state.users.find((u) => u.bot) || state.users[0];
        // Authorizationヘッダーがない場合やモックリクエストの場合はアクティブユーザーを優先
        const author = body.author_id
          ? state.users.find((u) => u.id === body.author_id) || botUser
          : (req.headers.authorization ? botUser : this.store.getActiveUser());

        const message = this.store.addMessage({
          channel_id: channelId,
          author: author,
          content: body.content || '',
          embeds: body.embeds || [],
          components: body.components || [],
        });

        this.sendJson(res, 200, message);
        return true;
      }
    }

    // 5. /api/v10/interactions/:interactionId/:token/callback (インタラクション応答)
    const interactionCallbackMatch = pathname.match(/^\/api\/v10\/interactions\/([^/]+)\/([^/]+)\/callback$/);
    if (interactionCallbackMatch && method === 'POST') {
      const body = await this.readBody(req);
      const state = this.store.getState();
      const botUser = state.users.find((u) => u.bot) || state.users[0];

      // Type 4: CHANNEL_MESSAGE_WITH_SOURCE
      if (body.data) {
        // 現在アクティブなチャンネルまたは一般チャンネルにメッセージを記録
        const targetChannel = state.channels[0];
        if (targetChannel) {
          this.store.addMessage({
            channel_id: targetChannel.id,
            author: botUser,
            content: body.data.content || '',
            embeds: body.data.embeds || [],
            components: body.data.components || [],
          });
        }
      }

      this.sendJson(res, 200, { type: body.type });
      return true;
    }

    // -------------------------------------------------------------
    // Mock Internal Programmable REST API (SDK / UT / Dashboard)
    // -------------------------------------------------------------

    if (pathname === '/api/mock/state' && method === 'GET') {
      this.sendJson(res, 200, this.store.getState());
      return true;
    }

    if (pathname === '/api/mock/reset' && method === 'POST') {
      const resetState = this.store.reset();
      this.sendJson(res, 200, resetState);
      return true;
    }

    if (pathname === '/api/mock/users' && method === 'POST') {
      const body = await this.readBody(req);
      const user = this.store.createUser(body);
      this.sendJson(res, 201, user);
      return true;
    }

    if (pathname === '/api/mock/switch-user' && method === 'POST') {
      const body = await this.readBody(req);
      const user = this.store.setActiveUser(body.userId);
      if (user) {
        this.sendJson(res, 200, user);
      } else {
        this.sendJson(res, 404, { error: 'User not found' });
      }
      return true;
    }

    if (pathname === '/api/mock/channels' && method === 'POST') {
      const body = await this.readBody(req);
      const channel = this.store.createChannel(body);
      this.sendJson(res, 201, channel);
      return true;
    }

    if (pathname === '/api/mock/interact' && method === 'POST') {
      const body = await this.readBody(req);
      const activeUser = this.store.getActiveUser();
      const channel = this.store.getState().channels.find((c) => c.id === body.channel_id);

      const resInfo = this.gateway.sendInteraction({
        type: body.type || InteractionType.APPLICATION_COMMAND,
        channel_id: body.channel_id,
        guild_id: channel?.guild_id,
        user: activeUser,
        data: body.data,
      });

      this.sendJson(res, 200, resInfo);
      return true;
    }

    return false;
  }

  private sendJson(res: http.ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private readBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  }
}
