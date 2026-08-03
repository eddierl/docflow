# SQS queues consolidated from the removed sqs.tf (PR #12).
resource "aws_s3_bucket" "uploads" {
  bucket = var.bucket_name
}

resource "aws_sqs_queue" "document_processing" {
  name = "docflow-document-processing"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.document_processing_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "document_processing_dlq" {
  name = "docflow-document-processing-dlq"
}
