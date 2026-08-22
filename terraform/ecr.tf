# Container image repository for the document-processing worker (ECS)
resource "aws_ecr_repository" "worker" {
  name = "docflow-worker"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "docflow-worker"
  }
}
