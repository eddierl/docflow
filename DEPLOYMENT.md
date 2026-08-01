# Deployment Guide

This guide covers deploying DocFlow to **real AWS** — moving from the local Floci-based development setup to production infrastructure.

## Architecture Comparison

| Component       | Local Dev          | AWS Production          |
| --------------- | ------------------ | ----------------------- |
| Database        | Docker PostgreSQL  | Amazon RDS / Aurora     |
| Object Storage  | Floci (S3 emulator)| Amazon S3               |
| Message Queue   | Floci (SQS emulator)| Amazon SQS             |
| API             | tsx (Node)         | AWS Lambda / ECS        |
| Worker          | tsx (Node)         | AWS Lambda / ECS        |
| Outbox Worker   | tsx (Node)         | AWS Lambda / ECS        |
| Infrastructure  | Terraform + Floci  | Terraform + AWS         |

---

## Option 1: Serverless (Lambda + API Gateway)

Best for variable workloads and minimal operations overhead.

### Terraform Changes

Update `terraform/provider.tf` to target real AWS:

```hcl
provider "aws" {
  region = var.aws_region
  # Credentials via IAM role, environment, or AWS CLI profile
}
```

Add to `terraform/variables.tf`:

```hcl
variable "aws_region" {
  type    = string
  default = "ap-southeast-2"  # Sydney
}

variable "environment" {
  type    = string
  default = "production"
}
```

Add Lambda functions, API Gateway, and IAM roles to `terraform/main.tf`:

```hcl
# Execution role for Lambda functions
resource "aws_iam_role" "docflow_lambda" {
  name = "${var.environment}-docflow-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "docflow_lambda_policy" {
  role       = aws_iam_role.docflow_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# API Gateway
resource "aws_apigatewayv2_api" "docflow" {
  name          = "${var.environment}-docflow-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "docflow" {
  api_id      = aws_apigatewayv2_api.docflow.id
  name        = "$default"
  auto_deploy = true
}

# API Lambda
resource "aws_lambda_function" "api" {
  function_name = "${var.environment}-docflow-api"
  role          = aws_iam_role.docflow_lambda.arn
  handler       = "dist/index.handler"
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      DATABASE_URL = aws_db_instance.docflow.endpoint
      PORT         = "3000"
    }
  }
}

# Worker Lambda (triggered by SQS)
resource "aws_lambda_function" "worker" {
  function_name = "${var.environment}-docflow-worker"
  role          = aws_iam_role.docflow_lambda.arn
  handler       = "dist/index.handler"
  runtime       = "nodejs22.x"
  timeout       = 900  # 15 min for OCR processing
  memory_size   = 512

  environment {
    variables = {
      DATABASE_URL = aws_db_instance.docflow.endpoint
      SQS_QUEUE_URL = aws_sqs_queue.document_processing.url
    }
  }
}

resource "aws_lambda_event_source_mapping" "worker" {
  event_source_arn = aws_sqs_queue.document_processing.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 1
}

# RDS
resource "aws_db_instance" "docflow" {
  identifier        = "${var.environment}-docflow"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "docflow"
  username          = var.db_username
  password          = var.db_password
  skip_final_snapshot = true
}
```

### Build for Lambda

Each app needs a build step that produces a deployable bundle:

```json
{
  "scripts": {
    "build": "tsc && pkg"
  }
}
```

Use a tool like [`@vercel/ncc`](https://github.com/vercel/ncc) or [`esbuild`](https://esbuild.github.io/) to bundle each service into a single file.

### Deploy

```bash
# Set AWS credentials
export AWS_PROFILE=my-aws-account

# Terraform
terraform -chdir=terraform init
terraform -chdir=terraform plan -var="aws_region=ap-southeast-2"
terraform -chdir=terraform apply

# Deploy Lambda functions
pnpm --filter @docflow/api build
pnpm --filter @docflow/worker build
# zip and upload each bundle...
```

---

## Option 2: Container (ECS Fargate)

Best for longer-running workers and stateful services.

### Dockerfiles

Each service already has a production-ready multi-stage Dockerfile:

| Service         | Dockerfile                      |
| --------------- | ------------------------------- |
| API             | `apps/api/Dockerfile`           |
| Worker          | `apps/worker/Dockerfile`        |
| Outbox Worker   | `apps/outbox-worker/Dockerfile` |

All Dockerfiles use **Node 22 Alpine** with a two-stage build (build → production). The production stage uses `tsx` to run TypeScript directly, keeping things simple — no separate build/compile step is needed.

For Lambda deployments, you'll need to add a bundler step (esbuild or ncc) to produce a compiled bundle. See the Lambda section below.

### ECS Terraform

```hcl
resource "aws_ecs_cluster" "docflow" {
  name = "${var.environment}-docflow"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${var.environment}-docflow-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "3000" },
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.rds_credentials.arn },
    ]
  }])
}
```

---

## Environment-Specific Configuration

Use a `.env.production` file (never committed) with real AWS values:

```bash
DATABASE_URL=postgresql://username:password@cluster.xyz.ap-southeast-2.rds.amazonaws.com:5432/docflow
SQS_QUEUE_URL=https://sqs.ap-southeast-2.amazonaws.com/123456789/docflow-document-processing
AWS_REGION=ap-southeast-2
# No AWS_ENDPOINT — uses real AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
```

## Security Checklist

- [ ] Store database credentials in **AWS Secrets Manager** (not env vars)
- [ ] Use **IAM roles** instead of access keys where possible (Lambda, ECS)
- [ ] Enable **S3 bucket versioning** and **encryption** (SSE-S3 or SSE-KMS)
- [ ] Add **SQS queue encryption** (SSE-SQS)
- [ ] Restrict **RDS security group** to only allow traffic from Lambda/ECS subnets
- [ ] Add **WAF** in front of API Gateway
- [ ] Enable **CloudWatch alarms** for DLQ depth > 0
- [ ] Add **request size limits** on the API (prevent abuse)
- [ ] Add **rate limiting** on upload endpoints

## Monitoring & Observability

| Concern            | Tool                              |
| ------------------ | --------------------------------- |
| Logs               | CloudWatch Logs (structured JSON from Pino) |
| Metrics            | CloudWatch Custom Metrics         |
| Alerts             | CloudWatch Alarms → SNS → Email   |
| Tracing            | AWS X-Ray (add `aws-xray-sdk`)    |
| DLQ Monitoring     | Alarm when DLQ depth > 0          |

## Rollback Strategy

- **Terraform:** `terraform apply -target=...` to roll back specific resources, or use state versions
- **Lambda:** Keep previous version; API Gateway can route to alias
- **ECS:** Service rollout with previous task definition; blue/green deployment
- **Database:** Drizzle migrations are forward-only; plan migration rollback scripts
