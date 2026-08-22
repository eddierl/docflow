output "s3_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "sqs_queue_url" {
  value = aws_sqs_queue.document_processing.url
}

output "table_name" {
  value = aws_dynamodb_table.documents.name
}

output "table_arn" {
  value = aws_dynamodb_table.documents.arn
}

output "api_endpoint" {
  value = "${aws_api_gateway_stage.docflow.invoke_url}/${aws_api_gateway_stage.docflow.stage_name}"
}

output "sns_topic_arn" {
  value = aws_sns_topic.events.arn
}

output "ecr_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.docflow.name
}

output "ecs_worker_log_group" {
  value = aws_cloudwatch_log_group.ecs_worker.name
}
