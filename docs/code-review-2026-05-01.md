# コードレビュー報告書

- **対象プロジェクト**: sales-booster (Next.js 16 / Prisma / NextAuth / React 19 / Supabase)
- **レビュー実施日**: 2026-05-01
- **対象範囲**: プロジェクト全体（src・設定・依存関係）
- **観点**: アーキテクチャ・設計 / セキュリティ / パフォーマンス / コード品質・保守性
- **スコアリング**: 観点別5段階＋総合点

---

## 1. 総合評価

| 観点                 | 評価 (5点満点) | 一言サマリ                                                                                                                                          |
| -------------------- | :------------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| アーキテクチャ・設計 |    **3.5**     | controller/service/repository の三層分離は良好。一方でテナント分離の防御線が脆く、Prismaスキーマのリレーション削除戦略に穴がある。                  |
| セキュリティ         |    **2.5**     | 認証/CSP/HTTPヘッダ等は丁寧だが、`next.config.ts`の`env`公開・レートリミット未実装・テナント検証の漏れが致命傷。                                    |
| パフォーマンス       |    **2.5**     | Root layout の `force-dynamic` で全ページSSR化、`getToken`の重複呼び出し、ポーリング5秒、エクスポート無制限取得が組み合わさり、規模拡大時に詰まる。 |
| コード品質・保守性   |    **3.5**     | 命名・型は概ね良好、ESLint/prettier整備済み。ただしController層のエラーハンドリングが画一的で、テストはRepository/Service中心でController未カバー。 |
| **総合点**           | **3.0 / 5.0**  | プロトタイプとしては高品質。ただし本番運用前に「セキュリティ Critical 3件 + パフォーマンス High 4件」を優先解消したい。                             |

---

## 2. セキュリティ (評価: 2.5 / 5.0)

### ~~🔴 Critical: `next.config.ts` で機密環境変数を公開している~~ ✅ 対応済み (commit a2a48ee)

~~Next.js の `env` ブロックでサーバ専用秘密をクライアントに露出していた問題。`env` ブロックを削除済み。~~

### 🔴 Critical: ログイン API にレートリミットなし

[lib/auth.ts:52-143](lib/auth.ts#L52-L143)

- `CredentialsProvider.authorize` で総当たり対策・アカウント列挙対策が無い。
- 失敗時 `return null` のみでログ無し。
- bcrypt比較自体は定数時間に近いが、ユーザー存在有無で処理パスが異なるため**タイミングリーク**の可能性がある（`accountCode`分岐で2回 `findFirst` を呼ぶケースとそうでないケースの応答時間差）。
- **対策**:
  - middleware か上位プロキシ (Cloudflare/WAF) でログインエンドポイントに rate-limit。
  - 失敗時 `auditLogRepository` に `USER_LOGIN_FAILED` を記録（現状は成功時のみ記録）。
  - ユーザー不在時もダミーbcrypt比較を走らせる（タイミングを揃える）。

### 🔴 Critical: `app/layout.tsx` の `force-dynamic` がDoS耐性を下げる

[app/layout.tsx:1](app/layout.tsx#L1)

- セキュリティ単独ではないが、全ページが動的SSRになるため低帯域DoSで全レンダリング負荷を強制できる。後述のパフォーマンス章とセットで対処。

### 🟠 High: アップロードAPIに未認可・テナント検証なし

[app/api/upload/route.ts:1-7](app/api/upload/route.ts) / [app/api/upload/avatar/route.ts:1-7](app/api/upload/avatar/route.ts)
[server/controllers/uploadController.ts:15-69](server/controllers/uploadController.ts#L15-L69)

- middleware の `ADMIN_API_PREFIXES` に `/api/upload` は含まれているのでログイン+ADMINロール必須にはなっているが、`uploadController.uploadFile` 自体はリクエストから `tenantId` を一切取らない。
- ファイル名は `${Date.now()}-${Math.random()...}.${ext}` で衝突回避はできているが、テナントごとのフォルダ分離がされておらず、Supabaseバケットレベルでの権限分離をしていない場合、URL推測で他テナントの画像が見える可能性（`bucketName: 'member-avatars'` 全テナント共用）。
- ファイルタイプ検証は `file.type`（クライアント送信値）依存。マジックバイト検証推奨。
- **対策**:
  - `folder` を `${folder}/${tenantId}/${fileName}` に変更。
  - `file-type` 等でバイナリ先頭を検証。
  - 拡張子は許可リスト方式（現状 `file.name.split('.').pop()` を信用しており、`avatar.exe` が `.exe` で保存される可能性）。

### ~~🟠 High: `acceptTerms` リポジトリが `tenantId` を取らない~~ ✅ 対応済み (commit 3d89a2e)

~~リポジトリ層で `tenantId` を必須化し、`updateMany({ where: { id, tenantId }, ... })` パターンに統一済み。~~

### 🟠 High: SUPER_ADMIN リポジトリの `update` が任意フィールド更新可能

[server/repositories/superAdminRepository.ts:43-55](server/repositories/superAdminRepository.ts#L43-L55)

```ts
update(id: string, data: Record<string, unknown>) {
  return prisma.user.update({ where: { id }, data, ... });
}
```

- service [server/services/superAdminService.ts:23-44](server/services/superAdminService.ts#L23-L44) では特定キー (email/name/status/password) のみフィルタしているので**現時点では安全**だが、リポジトリAPIの型 `Record<string, unknown>` が将来「うっかり `role` や `tenantId` を入れる」リスクを残す。
- **対策**: 厳密な型 (`{ email?: string; name?: string|null; status?: UserStatus; password?: string }`) に絞る。

### 🟡 Medium: bcrypt rounds の不統一

| 場所                                                                                        | rounds |
| ------------------------------------------------------------------------------------------- | :----: |
| [server/repositories/memberRepository.ts:73](server/repositories/memberRepository.ts#L73)   |   12   |
| [server/repositories/memberRepository.ts:109](server/repositories/memberRepository.ts#L109) |   12   |
| [server/services/superAdminService.ts:15,37](server/services/superAdminService.ts)          |   12   |
| [prisma/seed.ts:28,91,108](prisma/seed.ts#L28)                                              |   10   |

- 本番運用ではseedのadminパスワードが**rounds=10で永続化**される。
- **対策**: seed の hashSync を `hashSync(adminPassword, 12)` に統一。

### 🟡 Medium: SUPER_ADMIN の最低パスワード長が緩い

[server/controllers/superAdminController.ts:28-32, 50-54](server/controllers/superAdminController.ts#L28-L32)

- 8文字以上のチェックのみ。SUPER_ADMINは全テナント横断管理者なので [prisma/seed.ts:6](prisma/seed.ts#L6) と整合する**12文字以上推奨**。

### 🟡 Medium: パスワード強度ポリシー未実装

- 全パスワード設定箇所で「8文字以上」のみ。大文字・数字・記号・既知漏洩パスワード辞書チェックがない。
- `bcryptjs` 採用は妥当だが、`bcrypt` (ネイティブ) のほうがCPU効率は良い。

### 🟡 Medium: NextAuth 設定の調整不足

[lib/auth.ts:40-230](lib/auth.ts#L40-L230)

- `session.maxAge` 未指定→デフォルト30日。SaaSの管理者ロールには長い。
- `cookies` カスタム設定がなく `secure: true / sameSite: 'lax'` のデフォルト依存。本番運用では明示すべき。
- `signIn` ページのみ指定で `error` ページ未指定→未ハンドルエラーで NextAuth デフォルトページが露出。

### 🟢 Low: 監査ログでメールアドレスを `detail` に保存

[server/controllers/memberController.ts:82](server/controllers/memberController.ts#L82)

- `ユーザー「${name}」(${email})を作成` のように個人情報を文字列に埋め込み。GDPR/個人情報保護法上、削除要求対応が困難になる。
- **対策**: `userId` 参照のみに留め、PIIは `User` レコード参照経由で取得するか、別カラムに分離。

### 🟢 Low: CSP の `script-src 'unsafe-inline'`

[next.config.ts:67](next.config.ts#L67)

- Tailwind/Next.js の事情で必要だが、nonce / hash ベースに移行検討余地あり。

### 🟢 Low: `prisma/seed.ts` の `$executeRawUnsafe`

[prisma/seed.ts:637-639](prisma/seed.ts#L637-L639)

- テーブル名はハードコードされており実害はないが、`pg_get_serial_sequence($1, 'id')` のパラメータ化でも同等のことができる。

### ✅ 良い点（セキュリティ）

- HTTPセキュリティヘッダ (HSTS / X-Frame-Options / CSP / Permissions-Policy) を厳格に設定。
- `validateNextAuthSecret()` で本番起動時に弱いシークレットを拒否（[lib/auth.ts:7-38](lib/auth.ts#L7-L38)）。
- middlewareでロールベースのパス分離。
- Prisma利用箇所で `$queryRawUnsafe` 等の動的SQLは0件（seed以外）。
- React側で `dangerouslySetInnerHTML` の自前利用が0件。

---

## 3. パフォーマンス (評価: 2.5 / 5.0)

### 🔴 High: Root Layout 全体で `force-dynamic`

[app/layout.tsx:1](app/layout.tsx#L1)

- `export const dynamic = 'force-dynamic'` がRoot layoutに置かれているため、**全ページが毎回SSR**になりキャッシュ・ISRの恩恵を一切受けられない。
- 認証必須のSaaSとしてもログインページや静的ヘルプページは静的化したい。
- **対策**: `app/layout.tsx`からは外し、必要なpage/route個別に指定（例: `app/(authenticated)/sales/page.tsx` のみ）。

### 🔴 High: `getToken()` の重複呼び出し

[server/lib/auth.ts:4-58](server/lib/auth.ts#L4-L58)

- 各getter (`getUserId` / `getUserRole` / `getTenantId` / `isSuperAdmin` / `requireActiveLicense`) が毎回 `getToken({ req })` を独立に呼ぶ。
- 例えば `requireActiveLicense` は `getUserRole`→`getTenantId`→`tenantService.isLicenseExpired` の流れで `getToken` が**2回**走る。
- middlewareでも1回走っているので、書き込みAPI 1リクエストあたり最大3-4回 JWT復号する。
- **対策**:
  ```ts
  async function getAuthContext(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.id) throw new Error('Unauthorized');
    return {
      userId: token.id as string,
      role: (token.role as string) || 'USER',
      tenantId: token.tenantId as number | null,
    };
  }
  ```
  にまとめ、各controllerで1回だけ呼ぶ。

### 🔴 High: エクスポートAPIが全件無制限取得

[server/repositories/salesRecordRepository.ts:73-95](server/repositories/salesRecordRepository.ts#L73-L95) / [server/services/salesService.ts:687-713](server/services/salesService.ts#L687-L713) / [server/controllers/salesController.ts:514-552](server/controllers/salesController.ts#L514-L552)

- `findAll` には `take` 制限が無い。フィルタ未指定なら全テナント期間の全レコードを **メモリにロード**してJSONに変換。
- 数年分のデータがあると数十MB～GB級レスポンスとなり、Node.jsメモリOOM・タイムアウトの可能性。
- **対策**:
  - 上限ハードリミット (例: 5万件) を設けるか、ストリーミングダウンロード (`ReadableStream`) に変更。
  - 期間必須化、または cursor pagination (`cursor: { id }`) で分割エクスポート。

### 🔴 High: `getPreviousPeriodAverages` の逐次await（コメントが誤誘導）

[server/controllers/salesController.ts:370-386](server/controllers/salesController.ts#L370-L386)

```ts
// 逐次実行でDB接続プール枯渇を防止
const prevMonthAvg = await salesService.getPreviousPeriodAverage(...);
const prevYearAvg = await salesService.getPreviousPeriodAverage(...);
```

- コメント根拠が薄い。各 `getPreviousPeriodAverage` 内部では `Promise.all([records, users])` で2接続使うので、並列化すれば1リクエストで4接続。Prismaのデフォルト接続プールは10前後あるので問題にならない。
- 並列化でレスポンス時間ほぼ半減見込み。
- **対策**: `Promise.all([...])` で並列化。プール枯渇が真に懸念なら `Math.max(connection_limit, ...)` で接続プールを増やす方が筋が良い。

### ~~🟠 Medium: `useSalesPolling` のデフォルト 5秒間隔~~ ✅ 対応済み (commit 8d7b201)

~~ポーリングによる定常負荷の問題。Supabase Realtime broadcast 方式に移行し、`useSalesPolling` フック自体を削除。`tenant-events-{tenantId}` チャネルの `data-changed` イベントを購読する形に置き換え済み（速報通知も同チャネルの `new-record` イベントへ）。~~

### 🟠 Medium: 過剰 `include`

[server/repositories/salesRecordRepository.ts:26,33,62,92,188](server/repositories/salesRecordRepository.ts#L26)

- 全クエリで `{ user: { include: { department: true } }, dataType: true }` を強制include。
- breakingNews用には `user.imageUrl` だけ必要、export用には `department` 不要。
- **対策**: `select` に切り替えて呼び出し側が必要フィールドのみ取得。最低でも `findByPeriod` と `findLatest` を分離。

### 🟠 Medium: Prisma 複合インデックス不足

[prisma/schema.prisma:268-303](prisma/schema.prisma#L268-L303)

- `SalesRecord` に `@@index([tenantId])` のみ。実クエリは `WHERE tenantId = ? AND recordDate BETWEEN ? AND ?` が大半。
- **対策**: 以下を追加。
  ```prisma
  @@index([tenantId, recordDate])
  @@index([tenantId, userId, recordDate])
  ```
- `Target` も `@@index([tenantId, userId, year, month])` がほしい（ユニーク制約はあるが、それは検索ではない）。

### 🟡 Low: 大規模ライブラリの動的import未活用

[package.json:19-27](package.json#L19-L27)

- `exceljs`, `react-pdf`, `recharts` を初期バンドルに混ぜると数百KBオーバーヘッド。
- **対策**: 利用ページで `await import('exceljs')` 動的import化、もしくは `next/dynamic`。

### 🟡 Low: `getReportData` の月次ループ計算

[server/services/salesService.ts:370-514](server/services/salesService.ts#L370-L514)

- recordsを4回pass（buildMonthlyMap / dayOfWeekRatio / periodRatio / cumulativeTrend）。レコード数が大きければ1回pass化する余地。

### 🟡 Low: `unitCache` のキャッシュ寿命設計

[server/services/salesService.ts:38-57](server/services/salesService.ts#L38-L57)

- Promise解決後 `unitCache.delete(key)` するのでキャッシュとしては実質1リクエスト内のみ。in-flightデデュープに留まる。
- 名前を `inFlightUnitFetch` などに変えると意図が明確。

### ✅ 良い点（パフォーマンス）

- `findByPeriod` は `Promise.all([records, users])` で並列化済み。
- `getRankingBoardData` で広い範囲を1回取って `filter` で月別に分けている（[salesService.ts:541-552](server/services/salesService.ts#L541-L552)）。クエリ数を最小化する良い設計。
- `globalForPrisma` パターンで開発時のホットリロード時の接続増殖を防止（[lib/prisma.ts:10-31](lib/prisma.ts#L10-L31)）。
- SSE用 `app/api/sales/stream` を将来用意していそうな構造。

---

## 4. アーキテクチャ・設計 (評価: 3.5 / 5.0)

### 🔴 High: Prismaリレーションの `onDelete` が大半未指定

[prisma/schema.prisma](prisma/schema.prisma) 全体

- 32個のリレーションのうち `onDelete: Cascade / SetNull` 指定があるのは `Session.user` / `DisplayConfigBreakingNews.*` / `DisplayConfigView.*` のみ。
- `User` を物理削除すると `salesRecords` / `targets` / `groupMembers` / `auditLogs` で外部キー制約違反になる。
- **影響**: 現状 [memberRepository.ts:104-106](server/repositories/memberRepository.ts#L104-L106) は `deleteMany` だがおそらく実運用で踏むと例外。
- **対策**:
  - `User` 削除＝ `status: INACTIVE` のソフトデリートに統一（`AuditLog`, `salesRecords` を残せる）。
  - スキーマに以下を明示:
    ```prisma
    model SalesRecord { user User @relation(..., onDelete: Cascade) }
    model Target      { user User @relation(..., onDelete: Cascade) }
    model AuditLog    { user User @relation(..., onDelete: Restrict) }
    ```

### 🟠 Medium: `lib/` と `server/lib/` の境界が曖昧

- [lib/auth.ts](lib/auth.ts): NextAuth 設定（サーバ専用）が `lib/` にある。`use server` 境界も曖昧。
- [lib/prisma.ts](lib/prisma.ts): サーバ専用。`server/lib/`配下が望ましい。
- **対策**: 「クライアントから`import`可能か」を基準に分離。
  - 純粋ユーティリティ・型 → `lib/`
  - DB/認証/Service呼び出し → `server/lib/`

### 🟠 Medium: Controller層のヘルパーが Service 層に降りていない

[server/controllers/salesController.ts:23-68](server/controllers/salesController.ts#L23-L68)

- `resolveUserIds` / `resolveDataTypeId` / `resolveAggregateField` がController層に存在。Controller間で重複しがち。
- 同様の `searchParams` パースが [salesController.ts:300-345 / 400-440 / 515-550](server/controllers/salesController.ts) に多数。
- **対策**: `server/lib/queryParams.ts` などに `parseSalesFilter(searchParams, tenantId)` を切り出して全controllerで共有。

### 🟠 Medium: ファイル肥大化

| ファイル                                                                       | 行数 |
| ------------------------------------------------------------------------------ | ---: |
| [server/services/salesService.ts](server/services/salesService.ts)             |  878 |
| [server/controllers/salesController.ts](server/controllers/salesController.ts) |  609 |
| [prisma/seed.ts](prisma/seed.ts)                                               |  651 |

- `salesService` は集計ロジック・前期比較・速報・インポート・エクスポートを抱えていて分割推奨:
  - `salesAggregationService` (期間集計・トレンド・累計)
  - `salesReportService` (`getReportData`)
  - `salesRankingService`
  - `salesNotifyService` (breaking news)

### 🟡 Low: `auditLogService.create` をどこからでも `.catch(console.error)` で握りつぶしている

`grep "Audit log failed"` で**12件以上**ヒット。

- 監査ログの記録失敗はビジネス上重要だが、現状は標準エラーログのみ。
- **対策**:
  - `auditLogService` 内部で New Relic / Sentry にエスカレート (`newrelic.noticeError(err)`)。
  - 重要操作（ログイン・ロール変更・テナント作成）の監査ログ失敗時はリトライキューに入れるなど、最低限「失われた」事実が検知できる仕組みを作る。

### 🟡 Low: Component の階層整理

- `components/` 直下に `SalesPerformance.tsx` / `CumulativeChart.tsx` 等の機能コンポーネントとサブディレクトリ (`admin/`, `settings/`) が混在。
- **対策**: 直下にあるトップレベルファイルも `components/dashboard/` 等に整理。

### 🟡 Low: `middleware.ts` のパスハードコード

[middleware.ts:4-12](middleware.ts#L4-L12)

- `ADMIN_PATHS` / `ADMIN_API_PREFIXES` / `SUPER_ADMIN_API_PREFIXES` がmiddlewareファイル内に直書き。
- API数が増えるとこの配列の更新漏れが起こる（例: `/api/audit-logs` が一般ユーザーでもアクセス可、これが意図かは要確認）。
- **対策**: `config/routeAccess.ts` のような単一の真実源を作り、middlewareとAPIテストで共有。

### ✅ 良い点（アーキテクチャ）

- controllers / services / repositories の三層分離が一貫している。
- `ApiResponse` ユーティリティでレスポンス型を統一（[server/lib/apiResponse.ts](server/lib/apiResponse.ts)）。
- JST処理を `server/lib/dateUtils.ts` に集約（タイムゾーン依存の罠を1箇所で管理）。
- `tenantService.isLicenseExpired()` をライセンス制御の単一ゲートに使用。

---

## 5. コード品質・保守性 (評価: 3.5 / 5.0)

### 🟠 Medium: Controllerのエラーハンドリングが画一的すぎる

例: [server/controllers/salesController.ts:104-107](server/controllers/salesController.ts#L104-L107)

```ts
} catch (error) {
  console.error('Failed to fetch sales data:', error);
  return ApiResponse.serverError();
}
```

- 認可エラー（`requireActiveLicense` のthrow）が `serverError()` で500扱いになるパスがある。
- `ApiResponse.fromError` を使っている箇所と分かれており**書き分けの一貫性が欠如**。
- **対策**: 全catchで `ApiResponse.fromError(error, '...')` に統一し、`fromError` 側でログレベルを分ける。

### 🟠 Medium: テストカバレッジの偏り

- repositories/services にはテスト多数（[server/services/**tests**/](server/services/__tests__/)）。
- **controllerは0件**: 認可分岐 (`requireAdmin` / `requireActiveLicense`) のテストが無い。
- middleware・lib/auth.ts のテストが無い。
- **対策**:
  - controller の単体テスト（authモックの導入）。
  - middleware の境界テスト（権限なしで403/302を返すこと）。

### 🟡 Low: 型キャストの多用

[lib/auth.ts:147-178](lib/auth.ts#L147-L178)

```ts
token.role = (user as { role?: string }).role || 'USER';
token.tenantId = (user as { tenantId?: number | null }).tenantId ?? null;
```

- `next-auth.d.ts` で型拡張済みなのに、callbacks内で再アサーションしている。
- **対策**: `next-auth.d.ts` の `User` interface を実装に合わせて拡張し、`as` を取り除く。

### 🟡 Low: `Record<string, unknown>` の濫用

[server/repositories/superAdminRepository.ts:43,69,97](server/repositories/superAdminRepository.ts) / [server/repositories/salesRecordRepository.ts:43,74](server/repositories/salesRecordRepository.ts#L43)

- 「型は書きたくないが補完を捨てたい」という妥協が見える。
- Prismaの自動生成型 (`Prisma.SalesRecordWhereInput`) を素直に使うほうが安全。

### 🟡 Low: `.env.example` と `next.config.ts` の整合性

- `.env.example` に `SUPABASE_SERVICE_ROLE_KEY`、`NEXTAUTH_SECRET` の項目はあるが、`NEXTAUTH_SECRET` の生成コマンド注釈は良い一方で `SUPABASE_SERVICE_ROLE_KEY` が抜けている。
- `next.config.ts:11` で参照しているのに `.env.example` に対応行が無い。

### 🟡 Low: 通知失敗の無視

[server/controllers/salesController.ts:153-187](server/controllers/salesController.ts#L153-L187)

- LINE/Google Chat通知失敗が `console.error` のみ。重要顧客には通知漏れが致命的。
- **対策**: 失敗時にDBへ「未送信通知キュー」を残し、cronで再送する。

### 🟡 Low: 命名の表記揺れ

- `getJstDay` / `getJstDate` / `formatJstDateTime` / `jstStartOfMonth` が混在。
- **対策**: 動詞統一 (`getJstX` / `formatJstX` / `jstStartOf`) のいずれかに揃える。

### ✅ 良い点（コード品質）

- ESLint設定で `@typescript-eslint/no-explicit-any: 'error'` を強制（[eslint.config.mjs:22](eslint.config.mjs#L22)）。
- `tsconfig.json` `strict: true`。
- Prettier設定済み。`.prettierignore` あり。
- Vitest導入済み。CI(`amplify.yml` 想定）で `test:coverage` が回せる構成。
- `LogViewer.tsx` のように、Reactコンポーネントは fetch エラー時に再読み込みUIを出すなど、UX への配慮が見える。

---

## 6. 優先対応リスト（推奨）

優先度順。1〜3は本番運用前に必須対応。

| #   | 優先度       | 対象                                                                                                                                                                                            | 概要                                                                                                  |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | ~~🔴~~ ✅    | ~~[next.config.ts:4-14](next.config.ts#L4-L14)~~                                                                                                                                                | ~~サーバ専用秘密を `env` から削除~~ (commit a2a48ee)                                                  |
| 2   | 🔴           | [lib/auth.ts](lib/auth.ts) / middleware                                                                                                                                                         | ログインAPIにレートリミット + 失敗監査ログ                                                            |
| 3   | 🔴           | [app/layout.tsx:1](app/layout.tsx#L1)                                                                                                                                                           | `force-dynamic` を必要なpageに限定                                                                    |
| 4   | 🔴           | [prisma/schema.prisma](prisma/schema.prisma)                                                                                                                                                    | リレーションに `onDelete` 指定、複合INDEX追加                                                         |
| 5   | 🟠           | [server/lib/auth.ts](server/lib/auth.ts)                                                                                                                                                        | `getAuthContext()` 統合で `getToken` 1回化                                                            |
| 6   | 🟠           | [server/repositories/salesRecordRepository.ts:73-95](server/repositories/salesRecordRepository.ts#L73-L95)                                                                                      | エクスポートに上限/cursor導入                                                                         |
| 7   | 🟠           | [server/controllers/uploadController.ts](server/controllers/uploadController.ts)                                                                                                                | テナント別フォルダ + マジックバイト検証                                                               |
| 8   | 🟠 (一部 ✅) | ~~[server/repositories/memberRepository.ts:116-127](server/repositories/memberRepository.ts#L116-L127)~~ / [superAdminRepository.ts:43-55](server/repositories/superAdminRepository.ts#L43-L55) | リポジトリ層で `tenantId` 必須（acceptTerms 対応済 commit 3d89a2e） / 厳密型化（superAdmin は未対応） |
| 9   | 🟠           | [server/controllers/salesController.ts:370-386](server/controllers/salesController.ts#L370-L386)                                                                                                | `Promise.all` 並列化                                                                                  |
| 10  | ~~🟠~~ ✅    | ~~[hooks/useSalesPolling.ts:5](hooks/useSalesPolling.ts#L5)~~                                                                                                                                   | ~~デフォルト30秒・visibility停止~~ → Supabase Realtime broadcast 化で解消 (commit 8d7b201)            |
| 11  | 🟠           | controllerテスト未実装                                                                                                                                                                          | 認可分岐のユニットテスト追加                                                                          |
| 12  | 🟡           | bcrypt rounds 不整合 / PIIログ / NextAuth セッション設定                                                                                                                                        | 個別チューニング                                                                                      |

---

## 7. 評価サマリ（再掲）

```
Architecture & Design : 3.5 / 5.0
Security              : 2.5 / 5.0
Performance           : 2.5 / 5.0
Code Quality          : 3.5 / 5.0
─────────────────────────────────
Overall               : 3.0 / 5.0
```

- **強み**: 三層分離・JST集約・HTTPセキュリティヘッダ・型強制 (`no-explicit-any: error`)・Repository/Service層のテスト整備。
- **弱み**: 環境変数公開、レートリミット未実装、`force-dynamic`全体適用、リレーション削除戦略の欠落、controllerテスト未整備。

優先対応リストの **#1〜#4** を片付けるだけで、総合評価は3.5〜4.0レンジに上げられる見込みです。
