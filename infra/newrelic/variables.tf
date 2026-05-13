variable "aws_region" {
  description = "デプロイ先 AWS リージョン。Amplify SSR Lambda が動いているのと同じものを指定する。"
  type        = string
  default     = "ap-northeast-1"
}

variable "aws_profile" {
  description = <<-EOT
    Terraform 実行時に使う AWS CLI プロファイル名。
    "~/.aws/credentials" / "~/.aws/config" に登録された名前を指定する。
    別アカウントへの誤デプロイを防ぐため必須にしている（default なし）。
  EOT
  type        = string
}

variable "expected_account_id" {
  description = <<-EOT
    デプロイ先 AWS アカウント ID。Apply 前に現在の credential のアカウントと
    一致するか precondition で検証する。文字列で 12 桁の数字。
    別アカウントへの誤デプロイを多層的に防ぐためのガード。
  EOT
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.expected_account_id))
    error_message = "expected_account_id must be a 12-digit AWS account ID."
  }
}

variable "nr_license_key" {
  description = <<-EOT
    New Relic Ingest License Key。
    tfvars に書かず、TF_VAR_nr_license_key 環境変数で渡すこと。
    EU 契約の場合はキー prefix が "eu01x..." 等になっており、Lambda 側で自動判定される。
  EOT
  type        = string
  sensitive   = true
}

variable "amplify_log_group_names" {
  description = <<-EOT
    Amplify SSR Lambda の CloudWatch Logs ロググループ名（複数可）。
    "/aws/lambda/<...>" の形。CloudWatch コンソールで対象アプリの
    ロググループを特定して列挙する。
  EOT
  type        = list(string)
  # 例:
  # default = [
  #   "/aws/lambda/<your-amplify-app-id>-<branch>-<...>",
  # ]
}

variable "nr_tags" {
  description = <<-EOT
    New Relic Logs に付与するカスタムタグ。
    "key:value;key2:value2" のようにセミコロン区切りで指定。
    不要なら空文字列で OK。
  EOT
  type        = string
  default     = ""
}

variable "subscription_filter_pattern" {
  description = <<-EOT
    CloudWatch Logs Subscription Filter のパターン。
    空文字列で全ログ転送。エラーのみに絞るなら {$.level = "error"} 等。
  EOT
  type        = string
  default     = ""
}

variable "tags" {
  description = "全リソースに付ける共通タグ"
  type        = map(string)
  default = {
    Project   = "sales-booster"
    Component = "newrelic-log-ingestion"
    ManagedBy = "terraform"
  }
}
