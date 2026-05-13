################################################################################
# 別アカウントへの誤デプロイ防止ガード（precondition / 強制停止）
#
# providers.tf の check ブロックは警告レベルで止まらないため、resource の
# precondition で確実に apply を止める。
################################################################################
resource "terraform_data" "account_guard" {
  lifecycle {
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
      error_message = "AWS account mismatch: current credential resolves to ${data.aws_caller_identity.current.account_id}, but expected_account_id is ${var.expected_account_id}. AWS_PROFILE / aws_profile を確認してください。"
    }
  }
}

################################################################################
# New Relic 公式の log ingestion Lambda モジュール
#
# このモジュールは内部で Lambda 本体と実行ロールを作る。
# ビルド成果物（Python のパッケージ）は Docker でビルドされる
# （build_lambda = true がデフォルト）。
################################################################################
module "newrelic_log_ingestion" {
  source = "github.com/newrelic/aws-log-ingestion"

  nr_license_key = var.nr_license_key
  # モジュールが nr_tags を必須として要求するため空文字列で渡す。
  # ログに付ける独自タグが必要なら "env:prod;team:platform" のように
  # セミコロン区切りで指定する。
  nr_tags = var.nr_tags
  tags    = var.tags

  # account guard が通ってからモジュールを評価する
  depends_on = [terraform_data.account_guard]
}

################################################################################
# 各 Amplify ロググループ → newrelic-log-ingestion Lambda へのサブスクリプション
################################################################################
resource "aws_cloudwatch_log_subscription_filter" "to_newrelic" {
  for_each = toset(var.amplify_log_group_names)

  name            = "to-newrelic"
  log_group_name  = each.value
  filter_pattern  = var.subscription_filter_pattern
  destination_arn = module.newrelic_log_ingestion.function_arn

  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

################################################################################
# CloudWatch Logs から ingestion Lambda を呼び出すためのリソースベースポリシー
#
# 各ロググループ単位で source_arn を絞った permission を作る。
################################################################################
resource "aws_lambda_permission" "allow_cloudwatch" {
  for_each = toset(var.amplify_log_group_names)

  # statement_id はアカウント・関数内で一意である必要がある。
  # ロググループ名は長くなりがちなので md5 で短縮する。
  statement_id  = "AllowCWLogs-${substr(md5(each.value), 0, 8)}"
  action        = "lambda:InvokeFunction"
  function_name = module.newrelic_log_ingestion.function_arn
  principal     = "logs.amazonaws.com"
  source_arn    = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:${each.value}:*"
}
