// apps/server/src/gateway/gateway-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { StateStore } from '../state/store.js';
import { Message, User, VoiceState } from '../types.js';

export class GatewayServer {
  private wss: WebSocketServer;
  private store: StateStore;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private sequence = 0;

  constructor(wss: WebSocketServer, store: StateStore, port: number) {
    this.wss = wss;
    this.store = store;
    this.port = port;
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[Gateway] Bot connected to Discord Gateway WebSocket');

      // 1. Send OpCode 10 Hello immediately
      ws.send(
        JSON.stringify({
          op: 10,
          d: {
            heartbeat_interval: 41250,
          },
        })
      );

      ws.on('message', (data) => {
        try {
          const payload = JSON.parse(data.toString());
          this.handlePayload(ws, payload);
        } catch (e) {
          console.error('[Gateway] Failed to parse message:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[Gateway] Bot disconnected from Gateway');
      });
    });

    // Store のメッセージ追加イベントを Gateway 経由で Bot へ送信
    this.store.on('message', (msg: Message) => {
      // 自身（Bot）のメッセージでない場合のみ送信
      if (!msg.author.bot) {
        this.dispatch('MESSAGE_CREATE', {
          ...msg,
          channel_id: msg.channel_id,
          guild_id: msg.guild_id,
        });
      }
    });

    // Voice State 変更時
    this.store.on('voiceStateUpdate', (vs: VoiceState) => {
      this.dispatch('VOICE_STATE_UPDATE', {
        guild_id: vs.guild_id,
        channel_id: vs.channel_id || null,
        user_id: vs.user_id,
        session_id: vs.session_id,
        deaf: vs.deaf,
        mute: vs.mute,
        self_deaf: vs.self_deaf,
        self_mute: vs.self_mute,
      });
    });
  }

  private handlePayload(ws: WebSocket, payload: { op: number; d: any; s?: number; t?: string }) {
    switch (payload.op) {
      case 1: // Heartbeat
        ws.send(JSON.stringify({ op: 11 })); // Heartbeat ACK
        break;

      case 2: // Identify
        this.handleIdentify(ws, payload.d);
        break;

      case 4: // Voice State Update (BotがVCに接続/切断を要求したとき)
        this.handleVoiceStateUpdate(ws, payload.d);
        break;

      default:
        console.log(`[Gateway] Received unhandled op: ${payload.op}`);
    }
  }

  private handleIdentify(ws: WebSocket, data: any) {
    const state = this.store.getState();
    const botUser = state.users.find((u) => u.bot) || state.users[0];

    // 1. Send OpCode 0 READY
    this.sendToClient(ws, 'READY', {
      v: 10,
      user: botUser,
      guilds: state.guilds.map((g) => ({ id: g.id, unavailable: false })),
      session_id: 'mock-session-id-' + Date.now(),
      resume_gateway_url: `ws://127.0.0.1:${this.port}/gateway`,
      shard: data.shard || [0, 1],
      application: {
        id: botUser.id,
        flags: 0,
      },
    });

    // 2. Send OpCode 0 GUILD_CREATE for each guild
    for (const guild of state.guilds) {
      this.sendToClient(ws, 'GUILD_CREATE', {
        ...guild,
        joined_at: new Date().toISOString(),
        large: false,
        unavailable: false,
        member_count: state.users.length,
        voice_states: state.voiceStates.filter((vs) => vs.guild_id === guild.id),
        members: state.users.map((u) => ({
          user: u,
          roles: [],
          joined_at: new Date().toISOString(),
          deaf: false,
          mute: false,
        })),
        channels: guild.channels,
        presences: [],
      });
    }

    console.log(`[Gateway] Identified as Bot ${botUser.username} (${botUser.id}), dispatched READY and GUILDS`);
  }

  private handleVoiceStateUpdate(ws: WebSocket, data: { guild_id: string; channel_id: string | null; self_mute?: boolean; self_deaf?: boolean }) {
    const state = this.store.getState();
    const botUser = state.users.find((u) => u.bot) || state.users[0];

    if (data.channel_id) {
      // Bot joins VC
      console.log(`[Gateway] Bot joined voice channel: ${data.channel_id}`);
      this.store.joinVoice(botUser.id, data.channel_id);
      this.store.setBotStreamingVoice(true, data.channel_id);

      // 1. Send VOICE_STATE_UPDATE
      this.sendToClient(ws, 'VOICE_STATE_UPDATE', {
        guild_id: data.guild_id,
        channel_id: data.channel_id,
        user_id: botUser.id,
        session_id: 'mock-voice-session-' + Date.now(),
        deaf: false,
        mute: false,
        self_deaf: data.self_deaf || false,
        self_mute: data.self_mute || false,
      });

      // 2. Send VOICE_SERVER_UPDATE
      // endpoint にローカルモックのアドレスを返すことで透過的にローカルへ接続させる
      this.sendToClient(ws, 'VOICE_SERVER_UPDATE', {
        token: 'mock-voice-token-' + Date.now(),
        guild_id: data.guild_id,
        endpoint: `127.0.0.1:${this.port}`,
      });
    } else {
      // Bot leaves VC
      console.log(`[Gateway] Bot left voice channel`);
      this.store.leaveVoice(botUser.id);
      this.store.setBotStreamingVoice(false, null);

      this.sendToClient(ws, 'VOICE_STATE_UPDATE', {
        guild_id: data.guild_id,
        channel_id: null,
        user_id: botUser.id,
        session_id: 'mock-voice-session',
        deaf: false,
        mute: false,
        self_deaf: false,
        self_mute: false,
      });
    }
  }

  public dispatch(eventType: string, data: any) {
    this.sequence += 1;
    const payload = JSON.stringify({
      op: 0,
      s: this.sequence,
      t: eventType,
      d: data,
    });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private sendToClient(ws: WebSocket, eventType: string, data: any) {
    this.sequence += 1;
    ws.send(
      JSON.stringify({
        op: 0,
        s: this.sequence,
        t: eventType,
        d: data,
      })
    );
  }

  // UIやSDKから呼び出すインタラクション送出 (Slash Command, Button Click, etc.)
  public sendInteraction(interaction: {
    type: number;
    channel_id: string;
    guild_id?: string;
    data: any;
    user: User;
    message?: Message;
  }) {
    const id = this.store.nextId();
    const token = 'mock-interaction-token-' + id;
    const payload = {
      id,
      application_id: this.store.getState().users.find((u) => u.bot)?.id || '100000000000000001',
      type: interaction.type,
      data: interaction.data,
      guild_id: interaction.guild_id,
      channel_id: interaction.channel_id,
      member: interaction.guild_id
        ? {
            user: interaction.user,
            roles: [],
            joined_at: new Date().toISOString(),
            permissions: '8',
          }
        : undefined,
      user: interaction.user,
      token,
      version: 1,
      message: interaction.message,
    };

    console.log(`[Gateway] Dispatched INTERACTION_CREATE (${interaction.type}) from user ${interaction.user.username}`);
    this.dispatch('INTERACTION_CREATE', payload);
    return { id, token };
  }
}
