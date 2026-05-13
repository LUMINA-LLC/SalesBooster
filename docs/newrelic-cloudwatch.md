# New Relic ログ連携（Amplify / CloudWatch 経由）

## 背景と方針

本アプリでは New Relic にサーバ側ログを送ってモニタリングしている。

ただし AWS Amplify Hosting の SSR は内部的に AWS Lambda 上で動くため、
New Relic Node Agent (`newrelic` パッケージ) をそのまま動かすと以下の問題がある:

- agent はバックグラウンドで定期的に harvest してデータを送る設計だが、
  Lambda はリクエスト処理後にプロセスが凍結されるためバッファのデータが届かない
- agent の起動タイミング (`instrumentation.ts` での `await import('newrelic')`)
  が Next.js のリクエスト処理開始後になり、`http`/`prisma` 等のモンキーパッチ計装に
  間に合わない可能性がある

そこで Amplify 環境では **agent を使わず、stdout に出した構造化ログを
CloudWatch Logs → New Relic 公式の log ingestion Lambda 経由で
New Relic Logs に転送する**運用にしている。

```
Lambda stdout → CloudWatch Logs → Subscription Filter → newrelic-log-ingestion Lambda → New Relic Logs API
```

転送 Lambda は New Relic 公式リポジトリの
[newrelic/aws-log-ingestion](https://github.com/newrelic/aws-log-ingestion)
を SAM で 1 回デプロイするだけで用意できる。

ローカル開発や Amplify 以外の環境では従来どおり Node Agent を使う。
分岐は `instrumentation.ts` で `AWS_LAMBDA_FUNCTION_NAME` 環境変数の有無で判定している。

## アプリ側の構成

### `lib/logger.ts`

サーバ側専用 logger。`info` / `warn` / `error` / `debug` のレベル別 API を提供する。

- Amplify (Lambda) 環境: JSON 1 行で stdout に出力。`timestamp`, `level`,
  `message`, `service` などのフィールドを持ち、CloudWatch / New Relic Logs
  でフィールド検索できる
- それ以外: 通常の `console.*` で人間が読みやすい形式

`error` の第 2 引数に `Error`/`unknown` を渡すと、`error.message` /
`error.name` / `error.stack` を自動的に展開する。

### `instrumentation.ts`

Next.js のサーバ起動フック。

- `AWS_LAMBDA_FUNCTION_NAME` が立っていれば Node Agent をロードしない
- `NEW_RELIC_LICENSE_KEY` が空ならロードしない
- それ以外ではロードして APM を取る

## AWS 側の設定手順

CloudWatch Logs から New Relic Logs に転送するため、AWS コンソールで一度だけ設定する。

### 1. New Relic 側でライセンスキーを確認

[New Relic UI](https://one.newrelic.com/) にログインし、
「API keys」から **Ingest - License** タイプのキーをコピーしておく。

### 2. Amplify Console の環境変数

Amplify Console → 対象アプリ → 「Environment variables」で以下を設定:

- `NEW_RELIC_APP_NAME`: 例 `sales-booster`
- （`NEW_RELIC_LICENSE_KEY` は Amplify SSR Lambda には**不要**。後述の手順 4-2 で
  `newrelic-log-ingestion` Lambda 側に SAM の `--parameter-overrides` で渡す）

`NEW_RELIC_LICENSE_KEY` は Amplify Console から削除して構わない（agent を使わないため）。
ただしローカル `.env` には残しておくこと（ローカル開発で agent を使うため）。

### 3. CloudWatch Logs のロググループ名を特定

Amplify SSR の Lambda は AWS が自動で生成する。
CloudWatch Logs コンソールで対象アプリのロググループを探す。
通常は `/aws/lambda/<app-id>-<branch>-...` の形。

### 4. newrelic-log-ingestion Lambda + Subscription Filter を作成

Terraform 構成は [`infra/newrelic/`](../infra/newrelic/) に配置済み。
公式の [newrelic/aws-log-ingestion](https://github.com/newrelic/aws-log-ingestion)
モジュールを使って ingestion Lambda をデプロイし、CloudWatch Logs Subscription
Filter で Amplify ロググループから流す。**S3 や Firehose、IAM ロールの手作りは不要**。

リージョンは Amplify SSR Lambda が動いているのと同じものに揃えること
（東京なら `ap-northeast-1`）。

#### 4-1. tfvars を用意

```bash
cd infra/newrelic
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` の `amplify_log_group_names` に手順 3 で特定した
ロググループ名を全て列挙する。

#### 4-2. License Key を環境変数で渡す

```bash
# Windows PowerShell
$env:TF_VAR_nr_license_key = "<your-ingest-license-key>"

# macOS / Linux
export TF_VAR_nr_license_key="<your-ingest-license-key>"
```

> tfvars にハードコードしないこと。state ファイルにも `sensitive = true` で
> マークされているが念のため `terraform.tfstate` 自体の保護も意識する。

#### 4-3. デプロイ

```bash
terraform init
terraform plan
terraform apply
```

apply 完了で以下が作成される:

- `newrelic-log-ingestion` Lambda（モジュール内部で実行ロール・ロググループも作成）
- 各 Amplify ロググループに `to-newrelic` Subscription Filter
- Lambda 側に CloudWatch Logs からの呼び出し許可

#### 4-4. ロググループを増やす場合

`infra/newrelic/terraform.tfvars` の `amplify_log_group_names` リストに追加して
`terraform apply` するだけ。

Amplify SSR は **複数の Lambda ロググループ**（メイン SSR、Image Optimization、
API Routes 等）を持つことがあるので、CloudWatch コンソールで `/aws/lambda/` を
フィルタして Amplify アプリ ID を含むロググループを洗い出す。

#### 4-5. 動作確認

1. アプリにアクセスして API を叩く（ログを発生させる）
2. Lambda のロググループに JSON ログが出ることを確認（CloudWatch Logs Insights で
   1 〜 2 分以内に表示される）
3. `newrelic-log-ingestion` Lambda の **Monitor タブ** で
   - Invocations が増えていること
   - Errors が 0 であること
4. New Relic UI → Logs で `service:"sales-booster"` を検索（手順 5 参照）

うまく届かない場合は「トラブルシューティング」を参照。

#### 4-6. License Key を更新する場合

```bash
export TF_VAR_nr_license_key="<new-key>"
cd infra/newrelic
terraform apply
```

#### 4-7. 撤去する場合

```bash
cd infra/newrelic
terraform destroy
```

> 詳細・運用上の注意は [`infra/newrelic/README.md`](../infra/newrelic/README.md) を参照。

### 5. New Relic UI で確認

Logs 画面で `service:sales-booster` などで検索し、ログが届いているか確認。

JSON 構造化ログとして送っているので、`level`, `error.message`, `tenantId` 等の
フィールドで自由に絞り込める。

## NRQL での検索例

```sql
-- エラーログだけ
SELECT * FROM Log WHERE service = 'sales-booster' AND level = 'error'
SINCE 1 hour ago

-- 特定テナントの異常
SELECT * FROM Log
WHERE service = 'sales-booster' AND tenantId = 42
SINCE 1 day ago

-- Audit log 失敗の頻度
SELECT count(*) FROM Log
WHERE service = 'sales-booster' AND message = 'Audit log failed'
TIMESERIES 1 hour SINCE 1 day ago
```

## トラブルシューティング

### ログが New Relic に届かない

切り分けは **アプリ → CloudWatch → newrelic-log-ingestion Lambda → New Relic** の順に上流から見る。

1. **CloudWatch Logs** コンソールで該当ロググループに JSON ログが出ているか確認
   - 出ていない → アプリが Lambda にデプロイされていない / `logger` が呼ばれていない
2. ロググループに **Subscription Filter** が設定されているか確認
   （ロググループ画面の「サブスクリプションフィルター」タブで `to-newrelic` が出ているか）
3. **`newrelic-log-ingestion` Lambda の Monitor タブ** で以下を確認:
   - Invocations: CloudWatch から呼ばれているか（0 なら Subscription Filter
     の Lambda 実行権限を疑う）
   - Errors: 0 であること
   - Duration / Throttles: 著しく多ければスケール不足
4. `newrelic-log-ingestion` の **CloudWatch Logs**（自身の `/aws/lambda/newrelic-log-ingestion`）
   を見て、エラーメッセージから原因を特定:
   - `Invalid License Key` → 4-2 でビルド時に渡したキーを再確認
   - `403 / 401` → ライセンスキータイプ（**Ingest - License** か）を確認
   - エンドポイント関連エラー → US / EU エンドポイントを確認（`NRLogsEndpoint` 環境変数）
5. よくある原因:
   - New Relic ライセンスキーが間違っている / **User Key** を渡してしまっている
     （必要なのは **Ingest - License** タイプ）
   - エンドポイント URL が違う（US / EU の取り違え）
   - Subscription Filter のリソースベースポリシー（CloudWatch Logs から Lambda を
     呼び出す権限）が無い → コンソール経由で作っていれば自動で付くが、CLI で作った場合は
     `lambda:add-permission` を忘れていないか確認

### ローカルで agent を起動したい

`.env` に `NEW_RELIC_LICENSE_KEY` を設定して `npm run dev`。
`AWS_LAMBDA_FUNCTION_NAME` が立っていなければ `instrumentation.ts` が
agent をロードする。

### 移行時の旧設定の片付け

- `amplify.yml` の `cp newrelic.js .next/newrelic.js` 行は削除済み
- `next.config.ts` の `serverExternalPackages: ['newrelic', ...]` は
  ローカル/非 Amplify 環境で agent を使うため**残す**
- `package.json` の `newrelic` 依存も**残す**（同上）
