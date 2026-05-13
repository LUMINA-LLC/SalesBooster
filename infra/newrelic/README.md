# infra/newrelic

Amplify SSR Lambda の CloudWatch Logs を New Relic Logs に転送するための
Terraform 構成。

公式の [newrelic/aws-log-ingestion](https://github.com/newrelic/aws-log-ingestion)
モジュールで ingestion Lambda をデプロイし、CloudWatch Logs Subscription Filter
で Amplify ロググループから流す。

背景・全体像は [`../../docs/newrelic-cloudwatch.md`](../../docs/newrelic-cloudwatch.md)
を参照。

## 構成ファイル

| ファイル                   | 役割                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `versions.tf`              | Terraform / Provider バージョン制約                            |
| `providers.tf`             | AWS provider と data sources                                   |
| `variables.tf`             | 入力変数定義                                                   |
| `main.tf`                  | New Relic モジュール + Subscription Filter + Lambda Permission |
| `outputs.tf`               | Lambda ARN とサブスクライブ済みロググループ一覧                |
| `terraform.tfvars.example` | tfvars のテンプレート（コピーして使う）                        |

## state の扱い

今は **ローカル state** (`terraform.tfstate`) で運用する。`.gitignore` で除外済み。
チームで共有する段階で `backend "s3"` に移行する。

## 前提

- Terraform >= 1.5
- AWS CLI に **デプロイ先アカウント用の専用プロファイル**が登録済みであること
  （詳細は次節）
- 対象 AWS アカウントに **Amplify SSR Lambda が既にデプロイされている**こと
- New Relic の **Ingest - License** タイプの API キーを取得済みであること

## デプロイ先アカウント用の AWS プロファイルを登録する

このリポジトリの開発環境（普段使う AWS）と Amplify が動いている AWS が別アカウント
である運用を想定している。**現在の `[default]` プロファイルでうっかり apply
されないよう**に、本構成は `aws_profile` と `expected_account_id` を必須にしている。

### 1. プロファイルを追加

```bash
# IAM ユーザーを使う場合
aws configure --profile sales-booster-prod
# AWS Access Key ID:  <デプロイ先アカウント用のキー>
# AWS Secret Access Key: ...
# Default region name: ap-northeast-1
# Default output format: json
```

SSO を使っているなら `aws configure sso --profile sales-booster-prod` で同様に。

### 2. アカウント ID を確認

```bash
aws sts get-caller-identity --profile sales-booster-prod
```

`Account` フィールドの 12 桁の数字を控える。これを後述の
`expected_account_id` に渡す。

### 3. 必要な IAM 権限

このプロファイル（IAM ユーザー / Role）に最低以下の権限が必要:

- `iam:CreateRole` / `PassRole` / `AttachRolePolicy` / `DeleteRole`（ingestion Lambda 実行ロールの作成・削除）
- `lambda:*`（関数本体の作成・更新・削除）
- `logs:CreateLogGroup` / `PutSubscriptionFilter` / `DeleteSubscriptionFilter` / `DescribeLogGroups`
- `lambda:AddPermission` / `RemovePermission`

最小権限を厳格に絞りたい場合は `IAMFullAccess` + `AWSLambda_FullAccess` +
`CloudWatchLogsFullAccess` で十分。

## 初回デプロイ手順

### 1. tfvars を用意

```bash
cd infra/newrelic
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` を開き、以下を編集:

- `aws_profile`: 上で作ったプロファイル名（例: `sales-booster-prod`）
- `expected_account_id`: `aws sts get-caller-identity` で確認した 12 桁の数字
- `amplify_log_group_names`: CloudWatch Logs コンソールで `/aws/lambda/` を
  フィルタして Amplify アプリ ID を含むロググループを全て列挙
  （メイン SSR、Image Optimization、API Routes 等）

### 2. License Key を環境変数で渡す

```bash
# Windows PowerShell
$env:TF_VAR_nr_license_key = "<your-ingest-license-key>"

# macOS / Linux
export TF_VAR_nr_license_key="<your-ingest-license-key>"
```

> tfvars にはハードコードしないこと。state 内には平文で保存されるため、
> 必要に応じて state ファイル自体の保護も考える。

### 3. init / plan / apply

```bash
terraform init
terraform plan
terraform apply
```

apply 完了で:

- `newrelic-log-ingestion` Lambda が作成される
- 各 Amplify ロググループに `to-newrelic` Subscription Filter が貼られる
- Lambda 側に CloudWatch Logs からの呼び出し許可が設定される

### 4. 動作確認

1. アプリにアクセスして API を叩く（ログを発生させる）
2. Lambda のロググループに JSON ログが出ることを確認（CloudWatch Logs Insights）
3. ingestion Lambda の Monitor タブで Invocations 増加 / Errors 0 を確認
4. New Relic UI → Logs で `service:"sales-booster"` を検索

## 運用

### ロググループを増やす

`terraform.tfvars` の `amplify_log_group_names` リストに追加して `terraform apply`。

### License Key の更新

```bash
export TF_VAR_nr_license_key="<new-key>"
terraform apply
```

ingestion Lambda の環境変数 `LICENSE_KEY` が更新される。

### 撤去

```bash
terraform destroy
```

ingestion Lambda、Subscription Filter、Lambda Permission が全て削除される。

## トラブルシューティング

切り分けは **アプリ → CloudWatch → ingestion Lambda → New Relic** の順。

| 症状                                                 | 確認場所                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `terraform apply` が `AWS account mismatch` で止まる | `aws_profile` と `expected_account_id` の組合せを確認。プロファイル名のタイポがないか         |
| `No valid credential sources found` で止まる         | `~/.aws/credentials` に `aws_profile` で指定した名前のプロファイルがあるか確認                |
| そもそも CloudWatch Logs に出ない                    | Amplify SSR Lambda が起動しているか / アプリの logger が呼ばれているか                        |
| ingestion Lambda が呼ばれていない                    | ロググループの「サブスクリプションフィルター」タブを確認                                      |
| ingestion Lambda が Errors を出している              | `/aws/lambda/newrelic-log-ingestion` のログを見る。License Key 不正・エンドポイント不正が多い |
| Lambda Errors 0 だが New Relic に出ない              | キーの種類が User Key になっていないか / EU 契約で US エンドポイントを使っていないか          |

詳細は [`../../docs/newrelic-cloudwatch.md`](../../docs/newrelic-cloudwatch.md) のトラブルシューティング章を参照。
