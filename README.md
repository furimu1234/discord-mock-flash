# Discord Mock Flash (⚡ discord-mock-flash)

> **Discord Botの自動テスト（単体テスト・E2Eテスト・シナリオ検証）を高速かつ安全に実行するための完全スタンドアロン型 Discord Mock システム**

本物のDiscord APIや外部サーバーを介さず、開発者のローカル環境（`127.0.0.1`）または管理下VPS上のみでDiscord API（REST / Gateway WebSocket / Voice）およびDiscordクライアントWeb UIをエミュレートします。

---

## 🔒 セキュリティ & コンプライアンス方針

- **SaaS形式の完全排除**: 昨今の脆弱性祭り・APIトークン漏洩・サプライチェーン攻撃リスクを考慮し、マルチテナントSaaSとしての提供を禁止。ローカルPCまたは閉じたVPSでのセルフホスト運用を徹底します。
- **バインド制限**: すべての通信はデフォルトで `127.0.0.1`（localhost）にバインドされます。
- **クリーンルーム独自実装**: Discord公式の公開API仕様（Developer Documentation）のみを参照した互換独自実装であり、非公開APIのリバースエンジニアリングや本番APIスクレイピングは一切行いません。

---

## 🚀 クイックスタート (CLI First)

### 1. プロジェクト内ポータブル環境のセットアップ (初回のみ)
システムの環境変数を一切汚さず、本リポジトリ配下（`.tools/`）のみで完結するNode.js・pnpm環境を自動構築します。

```powershell
# PowerShellで実行
powershell -ExecutionPolicy Bypass -File .\scripts\setup-portable-node.ps1
```

### 2. サーバーの起動
```powershell
.\pnpm.cmd start
```

起動するとターミナルにアクセス用URLが出力されます：
```text
======================================================
  ⚡ Discord Mock Flash (Standalone Emulator)
  🔒 Security Mode: Local Self-Hosted (127.0.0.1)
------------------------------------------------------
  🌐 Web UI (Test & Admin):   http://127.0.0.1:3000
  🔌 Discord REST API Base:  http://127.0.0.1:3000/api/v10
  ⚡ Discord Gateway:        ws://127.0.0.1:3000/gateway
======================================================
```

ブラウザで `http://127.0.0.1:3000` を開くことで、即座にシミュレーション画面を利用できます。

---

## 🖥️ 主要機能

### 1. テスト画面 (Discord Client Emulator)
- **ダミーユーザーなりすまし切り替え**:
  - 画面上部のセレクトボックスから「操作するユーザー（Alice, Bob, etc.）」を即時切り替え。
  - チャット送信、`/play` などのスラッシュコマンド実行、ボタン押下などのインタラクションが、**「現在ログイン中のユーザー」としてBotへ送信**されます。
- **DM（ダイレクトメッセージ）の隔離**:
  - Botから届いたDMは送信先ユーザー専用。**そのユーザーにログインしていない限りDM内容は閲覧できません**。
- **ボイスチャンネル (VC) 音声再生シミュレーション**:
  - BotがVCに接続して音楽等を流している状態で、ログイン中ユーザーが同VCに参加すると**ブラウザのスピーカーからリアルタイムに音声が再生**（Web Audio API）。切断すると即座に停止します。

### 2. 管理画面 (Admin Dashboard)
- **CRUD操作**: ダミーユーザー（一般/BOT）、テキストチャンネル、ボイスチャンネル、ロールの追加・削除。
- **JSON永続化**: すべてのデータは `data/discord-mock-state.json` に自動保存・復元。
- **状態リセット**: テスト前の初期状態クリーンアップに対応。

### 3. プログラマブルSDK (自動テスト / UT)
JavaScript/TypeScript (`@discord-mock/client`) および Python (`discord-mock-client`) のテストSDKを提供。

```typescript
// TypeScript (Vitest / Jest)
import { DiscordMock } from '@discord-mock/client';

const mock = new DiscordMock({ baseUrl: 'http://127.0.0.1:3000' });
const user = await mock.createUser({ username: 'Alice' });

// Aliceとしてメッセージ送信
await mock.asUser(user).sendMessage(channelId, '/help');
// ボタン押下をシミュレート
await mock.asUser(user).clickButton(channelId, 'confirm_btn');
```

---

## 🤖 Botの接続設定 (Zero Code Changes)

Botのコード本体を修正することなく、接続先エンドポイントを本モックに向けるだけでテスト可能です。

### discord.js (JavaScript / TypeScript)
```typescript
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  rest: {
    api: 'http://127.0.0.1:3000/api', // REST Base URL をモックに変更
  },
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
});

// モックの /gateway/bot から自動的に ws://127.0.0.1:3000/gateway が返却されます
client.login('mock-token');
```

### discord.py (Python)
```python
import discord

# REST API Base をローカルモックに差し替え
discord.http.Route.BASE = "http://127.0.0.1:3000/api/v10"

client = discord.Client(intents=discord.Intents.all())
client.run('mock-token')
```

---

## 🧪 単体テストの実行

```powershell
.\apps\server\node_modules\.bin\vitest.CMD run
```

