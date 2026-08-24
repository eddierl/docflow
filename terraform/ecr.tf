resource "aws_ecr_repository" "worker" {
  name = "docflow-worker"

  tags = {
    Name = "docflow-worker"
  }
}