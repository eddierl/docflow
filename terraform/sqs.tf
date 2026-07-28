resource "aws_sqs_queue" "document_processing" {
  name = "docflow-document-processing"
}