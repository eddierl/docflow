# SNS topic for docflow domain events (uploads, processing results, ...)
resource "aws_sns_topic" "events" {
  name = "docflow-events"

  tags = {
    Name = "docflow-events"
  }
}

# Deliver everything published to the topic into the document-processing queue
resource "aws_sns_topic_subscription" "document_processing" {
  topic_arn = aws_sns_topic.events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.document_processing.arn
}

# Allow the topic to publish messages to the queue
resource "aws_sqs_queue_policy" "document_processing_sns" {
  queue_url = aws_sqs_queue.document_processing.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.document_processing.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.events.arn
          }
        }
      }
    ]
  })
}
