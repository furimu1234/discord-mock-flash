// apps/server/src/ui/ui-sync.ts
import { WebSocketServer, WebSocket } from 'ws';
import { StateStore } from '../state/store.js';
import { GatewayServer } from '../gateway/gateway-server.js';
import { InteractionType, ComponentType } from '../types.js';

export class UISyncServer {
  private wss: WebSocketServer;
  private store: StateStore;
  private gateway: GatewayServer;
  private clients: Set<WebSocket> = new Set();

  constructor(wss: WebSocketServer, store: StateStore, gateway: GatewayServer) {
    this.wss = wss;
    this.store = store;
    this.gateway = gateway;
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      // 初期状態をUIへ送信
      ws.send(
        JSON.stringify({
          type: 'STATE_UPDATE',
          data: this.store.getState(),
        })
      );

      ws.on('message', (msg) => {
        try {
          const action = JSON.parse(msg.toString());
          this.handleClientAction(ws, action);
        } catch (e) {
          console.error('[UISync] Invalid message from UI:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Store変更をすべてのUIクライアントにブロードキャスト
    this.store.on('change', (state) => {
      this.broadcast({
        type: 'STATE_UPDATE',
        data: state,
      });
    });
  }

  private handleClientAction(ws: WebSocket, action: { type: string; payload: any }) {
    const state = this.store.getState();
    const activeUser = this.store.getActiveUser();

    switch (action.type) {
      // ユーザー切り替え
      case 'SWITCH_USER': {
        this.store.setActiveUser(action.payload.userId);
        break;
      }

      // チャットメッセージ送信（現在ログイン中のユーザーとして送信）
      case 'SEND_MESSAGE': {
        const msg = this.store.addMessage({
          channel_id: action.payload.channelId,
          author: activeUser,
          content: action.payload.content,
        });
        break;
      }

      // スラッシュコマンド実行
      case 'EXECUTE_COMMAND': {
        const channel = state.channels.find((c) => c.id === action.payload.channelId);
        this.gateway.sendInteraction({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: action.payload.channelId,
          guild_id: channel?.guild_id,
          user: activeUser,
          data: {
            id: this.store.nextId(),
            name: action.payload.commandName.replace(/^\//, ''),
            type: 1,
            options: action.payload.options || [],
          },
        });
        break;
      }

      // ボタン押下（メッセージコンポーネント操作）
      case 'CLICK_BUTTON': {
        const channel = state.channels.find((c) => c.id === action.payload.channelId);
        const originalMessage = state.messages.find((m) => m.id === action.payload.messageId);
        this.gateway.sendInteraction({
          type: InteractionType.MESSAGE_COMPONENT,
          channel_id: action.payload.channelId,
          guild_id: channel?.guild_id,
          user: activeUser,
          message: originalMessage,
          data: {
            component_type: ComponentType.BUTTON,
            custom_id: action.payload.customId,
          },
        });
        break;
      }

      // VC 参加 / 切断
      case 'JOIN_VOICE': {
        this.store.joinVoice(activeUser.id, action.payload.channelId);
        break;
      }
      case 'LEAVE_VOICE': {
        this.store.leaveVoice(activeUser.id);
        break;
      }

      // Bot の VC 音声再生シミュレーション切り替え（テスト用）
      case 'TOGGLE_BOT_VOICE_STREAM': {
        const channelId = action.payload.channelId;
        const currentStreaming = state.botStreamingVoice && state.voiceStreamingChannelId === channelId;
        this.store.setBotStreamingVoice(!currentStreaming, !currentStreaming ? channelId : null);
        break;
      }

      // 管理画面用アクション
      case 'CREATE_USER': {
        this.store.createUser(action.payload);
        break;
      }
      case 'DELETE_USER': {
        this.store.deleteUser(action.payload.userId);
        break;
      }
      case 'CREATE_CHANNEL': {
        this.store.createChannel(action.payload);
        break;
      }
      case 'DELETE_CHANNEL': {
        this.store.deleteChannel(action.payload.channelId);
        break;
      }
      case 'RESET_STATE': {
        this.store.reset();
        break;
      }

      default:
        console.warn('[UISync] Unknown action type:', action.type);
    }
  }

  private broadcast(payload: any) {
    const data = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}

