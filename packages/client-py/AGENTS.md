# AGENTS.md - Python Client (`packages/client-py`)

本ドキュメントは、Python向けDiscord MockクライアントSDK（`packages/client-py`）の開発ガイドラインおよびコーディング規約を定義します。

---

## 1. 概要
- **パッケージ名**: `discord-mock-client`（予定）
- **対象環境**: Python 3.10 以上
- **役割**: Python製Botテスト（pytest + pytest-asyncio）からDiscord Mockサーバーを制御・操作・検証するためのSDK

---

## 2. ツールチェイン & パッケージ管理
- **パッケージマネージャー**: `uv` を使用する
  ```bash
  # 依存関係同期 / テスト実行
  uv sync
  uv run pytest
  ```
- **Linter & Formatter**: `Ruff` を使用する
  ```bash
  uv run ruff check .
  uv run ruff format .
  ```
- **型チェッカー**: `mypy` または `pyright` で厳格な型安全性を維持する
- **テストランナー**: `pytest` (`pytest-asyncio`)
- **配布先**: PyPI（GitHub Actions OIDC Trusted Publishing による自動化）
- **リリースタグ規則**: `py-vX.Y.Z`（例: `py-v1.0.0`）

---

## 3. 開発ルール
1. **API仕様の同期**:
   - `spec/` およびルート `AGENTS.md` に定義されたDiscord Mock API仕様に厳密に準拠すること。
   - `client-js` と同等の機能・メソッド名（Pythonicな命名 `snake_case`）を提供すること。
2. **非同期 First**:
   - すべてのI/O操作（RESTリクエスト、WebSocketイベント待機、アサーション）は `async/await` で設計すること。
   - `aiohttp` または `httpx` を利用した軽量かつ堅牢な実装とする。
3. **完全な型アノテーション**:
   - パブリックAPIにはすべて型ヒントを明記し、IDEのコード補完・静的解析を最大限支援すること。
4. **テストの徹底**:
   - 単体テストおよびMockサーバーとの結合テストを作成すること。

