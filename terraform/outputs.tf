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
