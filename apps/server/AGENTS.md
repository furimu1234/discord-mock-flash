# AGENTS.md - Mock Server (`apps/server`)

本ドキュメントは、Discord Mock サーバー（REST API / Gateway WebSocket / Voice Server）の開発ガイドラインおよび仕様を定義します。

---

## 1. 概要
- **役割**: 本物のDiscord API & Gateway & Voiceをエミュレートし、BotとWeb UIを透過的に中継するコアエンジン
- **バインドアドレス**: デフォルトで必ず `127.0.0.1`（セルフホスト・ローカル閉域厳守）

---

## 2. ツールチェイン & パッケージ管理
- **パッケージマネージャー**: `pnpm` (Workspace配下)
- **主要スタック**: Node.js, TypeScript, WebSocket (`ws`), WebRTC / 音声ストリーミング処理
- **テストランナー**: `vitest`

---

## 3. 主要エミュレーション仕様
1. **REST API (v10)**:
   - `/api/v10/gateway/bot` -> ローカルGateway WebSocket URL を返却
   - `/api/v10/channels/...`, `/api/v10/guilds/...` 等のDiscord公式エンドポイント互換
2. **Gateway WebSocket (v10)**:
   - OpCode 10 (Hello) -> OpCode 2 (Identify) -> OpCode 0 (Dispatch: READY, GUILD_CREATE)
   - Heartbeat 制御
   - Interaction Dispatch (`INTERACTION_CREATE`: Slash Command, Button, Select Menu)
3. **Voice Server**:
   - `VOICE_SERVER_UPDATE` の `endpoint` にローカルVoiceモックのIP:Portを返却
   - Botからの音声ストリームを受信し、Web UI（接続中ユーザー）へ配信
4. **State Store & JSON永続化**:
   - 単一のインメモリストアとローカルJSONファイル同期
   - 外部サーバーへの依存を一切排除
