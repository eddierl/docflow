# Networking for the ECS worker service
resource "aws_vpc" "docflow" {
  cidr_block           = "10.49.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "docflow"
  }
}

resource "aws_subnet" "worker" {
  vpc_id            = aws_vpc.docflow.id
  cidr_block        = "10.49.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "docflow-worker"
  }
}

resource "aws_security_group" "worker" {
  name   = "docflow-worker"
  vpc_id = aws_vpc.docflow.id

  # Health endpoint, reachable from within the VPC
  ingress {
    description = "worker health endpoint"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.docflow.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "docflow-worker"
  }
}
