# Common API Specification (`spec/`)

このディレクトリには、Discord Mock サーバーと各クライアントSDK（`client-js`, `client-py`）およびWeb UIが共有する共通API仕様・スキーマを配置します。

---

## 構成方針
- **OpenAPI / JSON Schema**: Mockサーバーが提供するREST APIエンドポイントおよび内部管理用APIのスキーマ定義
- **Event Schemas**: Gateway WebSocket / Voice イベントのペイロードスキーマ
- **State Schema**: 永続化JSON（ギルド、チャンネル、ロール、ユーザー、メッセージ）のデータスキーマ
