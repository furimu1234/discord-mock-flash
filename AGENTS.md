# AGENTS.md - Discord Mock (discord-mock-flash) 開発ガイドライン & 仕様書

本ドキュメントは、本プロジェクト（`discord-mock-flash`）に参画するAIエージェントおよび開発者が遵守すべきアーキテクチャ、セキュリティ方針、法的・規約遵守ポリシー、モノレポ構成、仕様、設計指針を定義する最上位の共通ルールです。

---

## 1. プロジェクト概要

`discord-mock-flash` は、**Discord Botの自動テスト（単体テスト・E2Eテスト・シナリオ検証）を高速かつ安全に実行するための完全スタンドアロン型 Discord Mock システム** です。

本物のDiscord APIやサーバーを介さず、ローカル環境または隔離されたプライベート環境内でDiscord API（REST / Gateway WebSocket / Voice）とDiscordクライアントUIをエミュレートし、Botの動作確認や自動テストを可能にします。

Web管理画面・Mockサーバー・JavaScriptクライアントSDK・PythonクライアントSDKをひとつの**Monorepo（モノレポ）**として一元管理し、API仕様の整合性と高いテスト自動化を実現します。

---

## 2. セキュリティ方針 & セルフホスト必須要件

### 2.1. SaaS形式の完全排除
昨今のサプライチェーン攻撃、クラウドアカウント侵害、APIトークン流出などのセキュリティインシデント（いわゆる脆弱性祭り）を鑑み、**本ツールをマルチテナント型のSaaS（外部公開クラウドサービス）として提供・運用することは固く禁じます。**

### 2.2. セルフホスト運用の徹底
- **動作保証環境**:
  - 開発者自身のローカルPC（`localhost` / `127.0.0.1`）
  - 開発者が厳格に管理するプライベートVPS / プライベートオンプレミスサーバー
- **アクセス制御**:
  - 外部ネットワークからの不用意な直接アクセスを遮断し、閉じたネットワークまたは安全なSSHポートフォワード / VPN経由でのみ利用可能とします。
  - テスト用Botトークンやシミュレートされたユーザーデータが外部へ漏洩しないサンドボックス構成を維持します。

---

## 3. 法的コンプライアンス & Discord規約遵守ポリシー

開発者およびAIエージェントは、Discordの利用規約（Developer Terms of Service / Developer Policy）および知的財産権を厳格に尊重しなければなりません。

### 3.1. クリーンルーム実装原則
- **公開仕様に基づく独自実装**:
  - Discord公式の公開API仕様（[Discord Developer Documentation](https://discord.com/developers/docs)）のみを参照し、互換性のあるJSONレスポンスやイベントペイロードを独自に実装します。
- **リバースエンジニアリングの禁止**:
  - Discordの公式クライアント内部実装、非公開API（Internal API / Private API）、独自通信プロトコルの逆コンパイルや解析行為は一切行いません。
- **データ・レスポンスの完全モック化**:
  - ダミーデータ（ユーザー、ギルド、メッセージなど）およびレスポンスはすべて本Mock内部で独自生成します。本番環境のデータ収集や本物のDiscordサーバーへのスクレイピングは行いません。
- **ドキュメント・サンプルのライセンス遵守**:
  - 公式ドキュメントの文章やサンプルコードを引用・転載する場合は、各ライセンス条件を遵守します。
- **本番API非依存**:
  - 本番のDiscord APIへの外部通信や、本番Discord認証（OAuth / Bot Tokenの外部検証）を一切必要としません。

### 3.2. 規約違反要求に対する拒否ポリシー（「ダメなものはダメ」）
AIエージェントおよび開発者は、以下に該当する実装または要求があった場合、**「Discord利用規約・ポリシー違反および法的リスクがあるため実装できない」と明示的に拒否・指摘しなければなりません。**
- ❌ **SelfBot / UserBotの自動化支援**: ユーザーアカウントトークンを用いた自動化や、公式クライアント偽装機能。
- ❌ **非公開エンドポイントの模倣・悪用**: Discord公式クライアント専用エンドポイントの解析や模倣。
- ❌ **トークン・認証情報の窃取・バイパス機能**: 本番アカウントの不正アクセスや検証迂回につながるコード。
- ❌ **迷惑行為・スパム・レイド支援ツール**: メッセージの大量スパム送信機能など。

### 3.3. 将来的なOSS公開時の注意
本プロジェクトをオープンソース（OSS）として広く公開する場合は、API互換サーバーを提供する行為自体について、事前にDiscord Developer Supportへ確認を行い、規約面の不確実性を排除する方針とします。

---

## 4. モノレポ構造 (Monorepo Architecture)

本プロジェクトは1つのリポジトリにサーバー、UI、クライアントSDK、仕様を集約するモノレポ構成を採用します。

### 4.1. ディレクトリ構成
```text
discord-mock-flash/
├── AGENTS.md                  # 全体共通ルール & AI開発ガイドライン（本書）
├── package.json               # ルート npm / pnpm workspace 定義
├── pnpm-workspace.yaml        # pnpm workspace 設定
├── apps/
│   ├── web/                   # ブラウザ操作UI（テスト画面 & 管理画面）
│   │   └── AGENTS.md          # Webフロントエンド固有ルール
│   └── server/                # Discord Mock API / Gateway / Voice サーバー
│       └── AGENTS.md          # Mockサーバー固有ルール
├── packages/
│   ├── client-js/             # npm公開用 JavaScript/TypeScript クライアントSDK
│   │   └── AGENTS.md          # JS Client固有ルール
│   └── client-py/             # PyPI公開用 Python クライアントSDK (uv管理)
│       └── AGENTS.md          # Python Client固有ルール
├── spec/                      # 共通API仕様・スキーマ定義 (OpenAPI / JSON Schema)
├── tests/                     # 結合テスト・クロス言語クライアント互換性テスト
└── .github/
    └── workflows/             # CI/CD パイプライン (lint, test, publish)
```

### 4.2. パッケージ管理方針
| プロジェクト | 言語 / ランタイム | パッケージマネージャー | 設定ファイル | 配布先 |
|---|---|---|---|---|
| **Root / Apps / client-js** | Node.js / TypeScript | `pnpm` (Workspace) | `package.json`, `pnpm-workspace.yaml` | npm (`@discord-mock/*` 等) |
| **packages/client-py** | Python 3.10+ | `uv` | `pyproject.toml` | PyPI (`discord-mock-client` 等) |

### 4.3. 独立リリース方針 & リリースタグ命名規則
各パッケージは独立したバージョンおよびリリースタグで管理・公開します。
- JS Client: `js-v1.0.0`
- Python Client: `py-v1.0.0`
- Server / App: `server-v1.0.0`

GitHub Actionsでは変更されたディレクトリに応じてテストを実行し、OIDC（Trusted Publishing）を活用してnpmおよびPyPIへ独立して公開します。

---

## 5. 主要システム要件 & アーキテクチャ

### 5.1. 起動フロー (CLI First)
- ターミナルからCLIコマンド1発で起動（例: `pnpm start` または `discord-mock start`）。
- 起動時にローカルWebサーバーが立ち上がり、アクセス可能なURL（例: `http://localhost:3000`）がコンソールに出力される。
- ユーザーはそのURLをブラウザで開くことで、即座にシミュレーション・管理画面を利用できる。

### 5.2. ソースコード変更なし（透過的）でのBotテスト機構
`discord.js`, `discord.py` などのBotコードを修正することなく、環境変数や設定差し替えのみでMockへ完全ルーティングできる設計とします。

1. **REST API Base URL の差し替え**:
   - `http://127.0.0.1:PORT/api/v10` をエンドポイントとして指定。
2. **Gateway WebSocket の自動差し替え**:
   - RESTの `/gateway` または `/gateway/bot` エンドポイントが、ローカルのGateway URL（例: `ws://127.0.0.1:PORT/gateway`）を返却することで、Botが意識することなくローカルGatewayへ接続。
3. **Voice 接続先（Voice Gateway / Server）の差し替え**:
   - BotがVCに接続した際にMockが送信する `VOICE_SERVER_UPDATE` イベントの `endpoint` フィールドにローカルのVoice Mockエンドポイント（例: `127.0.0.1:VOICE_PORT`）を設定することで、音声パケット（UDP / WebRTC）の送受信先もローカルに閉じた状態で完全透過ルーティング。

### 5.3. コンポーネント構成図
```
+-------------------------------------------------------------------------------+
|                             discord-mock-flash                                |
|                                                                               |
|  +--------------------+   +-----------------------+   +--------------------+  |
|  |     テスト画面     |   |       管理画面        |   | client-js / py SDK |  |
|  |   (apps/web)       |   |      (apps/web)       |   | (packages/*)       |  |
|  | Discord風クライアント|  | ユーザー/チャンネル/  |   | コードからの操作   |  |
|  |  シミュレータ      |   | ロール管理GUI         |   | ・アサートAPI      |  |
|  +---------+----------+   +-----------+-----------+   +---------+----------+  |
|            |                          |                         |             |
|            +--------------------------+-------------------------+             |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  |                        Core Mock Engine (apps/server)                   |  |
|  |  - REST API Emulator (Discord v10 API 互換)                             |  |
|  |  - Gateway WebSocket Emulator (Heartbeat, Dispatch, Interactions)       |  |
|  |  - Voice Server Emulator (Voice Gateway + WebRTC / Audio Streaming)     |  |
|  |  - State Manager & Event Bus                                            |  |
|  +------------------------------------+------------------------------------+  |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  |                     JSON Persistence Layer (.json)                      |  |
|  |  (Guilds, Channels, Roles, Dummy Users, Messages, Settings)             |  |
|  +-------------------------------------------------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        ^
                                        | (Discord Gateway, REST, Voice 通信)
                                        v
                       +---------------------------------+
                       |   Target Discord Bot under Test |
                       | (discord.js / discord.py / etc) |
                       |  * No code changes required!    |
                       +---------------------------------+
```

---

## 6. 機能仕様詳細

### 6.1. テスト画面 (Discord風クライアント画面)
- **ダミーユーザーログイン / なりすまし切り替え**:
  - UI上で作成済みのダミーユーザー一覧から「現在操作するユーザー」を即座に切り替え可能。
- **インタラクション実行**:
  - スラッシュコマンド（`/command`）の実行。
  - メッセージ送信、メンション、絵文字リアクション。
  - Botが送信したメッセージコンポーネント（ボタン、セレクトメニュー、モーダルなど）の押下・入力送信。
  - すべてのイベントは「現在ログイン中のダミーユーザー」としてBot（Gateway）に送信される。
- **ダイレクトメッセージ (DM) の隔離**:
  - Botから送信されたDMは各ユーザー固有のDMチャンネルに格納される。
  - 送信先ユーザーとしてログインしていない限り、そのDMの内容を閲覧できない仕様（プライバシーと権限の厳密なシミュレーション）。
- **ボイスチャンネル (VC) 音声再生シミュレーション**:
  - Botが音楽再生等の目的で特定のボイスチャンネル（例: `VC A`）に接続している場合、ログイン中のダミーユーザーが同チャンネル（`VC A`）に接続すると、Botから送られてくる音声ストリームがブラウザのスピーカーから再生される。
  - ダミーユーザーがVCから切断した場合は音声再生が即時停止する。
  - 複数VCの独立した音声ストリーム管理に対応。

### 6.2. 管理画面 (Admin Dashboard)
- **エンティティのCRUD操作**:
  - **ダミーユーザー**: ID、ユーザー名、アバター、Botフラグなどの追加・編集・削除。
  - **ギルド（サーバー）**: サーバー名、アイコン等の管理。
  - **チャンネル**: テキストチャンネル、ボイスチャンネル、カテゴリ等の作成・階層設定。
  - **ロール & 権限**: ロール作成、色、パーミッション設定、ダミーユーザーへの付与。
- **状態管理**:
  - 現在のモック状態のリセット（クリーンアップ）。
  - シナリオごとの初期状態の保存とロード。

### 6.3. 自動テスト (UT) & プログラマブルSDK
- テストコード（Jest, Vitest, pytest, etc.）から直接呼び出し可能なクライアントライブラリ（`client-js`, `client-py`）を提供。
- **管理画面で行えるすべての操作はSDK（API）からも実行可能**:
  ```typescript
  // TypeScript (client-js) 利用例
  const mock = await DiscordMock.init();
  const guild = await mock.createGuild({ name: "Test Server" });
  const user = await mock.createUser({ username: "Alice" });
  const voiceChannel = await guild.createVoiceChannel({ name: "Music VC" });
  
  // BotをVCに接続させ、AliceとしてVCに接続して音声パケット受信をアサート
  await mock.asUser(user).joinVoice(voiceChannel.id);
  ```
  ```python
  # Python (client-py) 利用例
  async with DiscordMock.init() as mock:
      guild = await mock.create_guild(name="Test Server")
      user = await mock.create_user(username="Alice")
      vc = await guild.create_voice_channel(name="Music VC")
      await mock.as_user(user).join_voice(vc.id)
  ```
- Botからの応答（メッセージ内容、Embed、コンポーネント、DM）を検証するアサーションヘルパー。

### 6.4. データ永続化 (JSON)
- すべてのエンティティ（ギルド、チャンネル、ロール、ユーザー、メッセージ）はローカルのJSONファイルにシリアライズ・保存される。
- これにより、CLI再起動後も状態を維持でき、テストケースごとのシードデータ（フィクスチャ）としても再利用可能。

---

## 7. 全体共通AI開発ルール & 実装方針

本プロジェクトのコード生成・修正を行うAIエージェントおよび開発者は以下のルールを厳守してください。

1. **セキュリティ & コンプライアンス第一**:
   - 外部サーバーへのテレメトリ送信やクラウド連携機能は一切実装しないこと。
   - すべてのバインドアドレスはデフォルトで `127.0.0.1` とし、外部公開を意図しない設計にすること。
   - セクション3の規約・ポリシーを遵守し、規約違反となる実装要求は明確に拒否すること。
2. **メインブランチへの直接プッシュ禁止**:
   - 必ずトピックブランチ（`feature/*`, `fix/*` 等）を作成し、PR経由でマージすること。
3. **仕様同期 & クロス言語互換性の維持**:
   - `spec/` またはMockサーバーのAPI仕様を変更した際は、必ず `client-js` と `client-py` の双方の互換性を確認し、関連するテストスイートを実行すること。
4. **サブディレクトリAGENTS.mdの遵守**:
   - 各サブプロジェクト（`apps/web`, `apps/server`, `packages/client-js`, `packages/client-py`）で作業を行う際は、各ディレクトリに配置された `AGENTS.md` の言語固有ルール（Linter, フォーマッタ, テストランナー等）に厳格に従うこと。
5. **テスト駆動開発 (TDD)**:
   - 各コンポーネントおよびSDKには単体テストを用意し、回帰を防ぐこと。
6. **ドキュメントの最新維持**:
   - 仕様変更や新機能追加時は、必ず関連する `AGENTS.md` およびドキュメントを更新すること。
