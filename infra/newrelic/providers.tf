provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# 現在のアカウント / リージョン情報。Subscription Filter の source_arn 構築や
# 誤デプロイ防止のチェック (check ブロック) に使う。
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# 別アカウントへの誤デプロイ防止ガード。
# var.expected_account_id と現在の credential のアカウントが一致しないと plan/apply で失敗する。
check "account_id_matches" {
  assert {
    condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
    error_message = "AWS account mismatch: current credential resolves to ${data.aws_caller_identity.current.account_id}, but expected_account_id is ${var.expected_account_id}. AWS_PROFILE / aws_profile を確認してください。"
  }
}
