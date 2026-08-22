# ECS cluster hosting the document-processing worker
resource "aws_ecs_cluster" "docflow" {
  name = var.cluster_name

  tags = {
    Name = var.cluster_name
  }
}

# Worker task definition: Fargate, awsvpc, logs to CloudWatch
resource "aws_ecs_task_definition" "worker" {
  family                   = "docflow-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = aws_iam_role.ecs_task_execution.arn
  task_role_arn      = aws_iam_role.ecs_task_worker.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${aws_ecr_repository.worker.repository_url}:${var.worker_image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = 3001
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_worker.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "docflow-worker"
        }
      }
    }
  ])

  tags = {
    Name = "docflow-worker"
  }
}

# Long-running worker service
resource "aws_ecs_service" "worker" {
  name            = "docflow-worker"
  cluster         = aws_ecs_cluster.docflow.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [aws_subnet.worker.id]
    security_groups = [aws_security_group.worker.id]
  }

  depends_on = [aws_cloudwatch_log_group.ecs_worker]
}
