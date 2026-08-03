# SQS queues were consolidated from the removed sqs.tf file (see PR #11).
# They are now defined inline here alongside the S3 bucket.
resource "aws_s3_bucket" "uploads" {
  bucket = var.bucket_name
}