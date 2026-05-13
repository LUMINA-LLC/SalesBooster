output "ingestion_lambda_arn" {
  description = "newrelic-log-ingestion Lambda の ARN"
  value       = module.newrelic_log_ingestion.function_arn
}

output "subscribed_log_groups" {
  description = "Subscription Filter を貼った CloudWatch Logs ロググループ一覧"
  value       = sort(var.amplify_log_group_names)
}
