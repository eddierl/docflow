resource "aws_scheduler_schedule" "cleanup_idempotency" {
  name = "cleanup-idempotency"

  schedule_expression = "rate(1 hour)"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.cleanup_idempotency.arn
    role_arn = aws_iam_role.cleanup_scheduler.arn
  }
}