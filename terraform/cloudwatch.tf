# CloudWatch log group for ECS worker tasks (referenced by the task definition)
resource "aws_cloudwatch_log_group" "ecs_worker" {
  name              = "/ecs/docflow-worker"
  retention_in_days = 30

  tags = {
    Name = "docflow-ecs-worker"
  }
}

# Alarm on worker CPU usage
resource "aws_cloudwatch_metric_alarm" "worker_cpu" {
  alarm_name          = "docflow-worker-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtil"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = "80"

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = "docflow-worker"
  }

  alarm_description = "Document-processing worker CPU is above 80%"
}
