# AGENTS.md - JavaScript/TypeScript Client (`packages/client-js`)

本ドキュメントは、Node.js / ブラウザ向けDiscord MockクライアントSDK（`packages/client-js`）の開発ガイドラインおよびコーディング規約を定義します。

---

## 1. 概要
- **パッケージ名**: `@discord-mock/client`（予定）
- **対象環境**: Node.js 18+ / ESM & CommonJS
- **役割**: JavaScript/TypeScript製Botテスト（Jest, Vitest, Playwright）からDiscord Mockサーバーを制御・操作・検証するためのSDK

---

## 2. ツールチェイン & パッケージ管理
- **パッケージマネージャー**: `pnpm` (Workspace配下)
  ```bash
  pnpm --filter @discord-mock/client test
  pnpm --filter @discord-mock/client build
  ```
- **ビルドツール**: `tsup` または `unbuild`（ESM & CJS デュアル出力 + 型定義 `.d.ts`）
- **Linter & Formatter**: `biome` または `eslint` + `prettier`
- **テストランナー**: `vitest`
- **配布先**: npm registry（GitHub Actions OIDC Trusted Publishing による自動化）
- **リリースタグ規則**: `js-vX.Y.Z`（例: `js-v1.0.0`）

---

## 3. 開発ルール
1. **API仕様の同期**:
   - `spec/` およびルート `AGENTS.md` に定義されたDiscord Mock API仕様に準拠すること。
   - `client-py` と一貫した機能セットを提供すること（TypeScriptらしい `camelCase` 命名）。
2. **型安全性の徹底**:
   - 厳格なTypeScript設定（`strict: true`）で実装し、Genericsやイベント型の型推論を充実させること。
3. **ゼロ依存志向**:
   - ランタイム依存は最小限（Native `fetch` / `WebSocket` を優先）とし、バンドルサイズを抑えること。
4. **テストの徹底**:
   - 単体テストおよびMockサーバーとの結合テストを作成すること。

