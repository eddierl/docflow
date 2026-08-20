# IAM role for Lambda execution
resource "aws_iam_role" "lambda_exec" {
  name = "docflow-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "docflow-lambda-exec"
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "docflow-lambda-dynamodb"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda function - upload handler
data "archive_file" "upload_handler" {
  type        = "zip"
  source_dir  = "${path.module}/../packages/lambda-upload"
  output_path = "${path.module}/lambda-upload.zip"
}

resource "aws_lambda_function" "upload_handler" {
  function_name    = "docflow-upload-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.upload_handler.output_path
  source_code_hash = data.archive_file.upload_handler.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = var.table_name
    }
  }

  tags = {
    Name = "docflow-upload-handler"
  }
}

# API Gateway integration with Lambda (AWS_PROXY)
resource "aws_api_gateway_integration" "documents_post_lambda" {
  rest_api_id   = aws_api_gateway_rest_api.docflow.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = aws_api_gateway_method.documents_post.http_method
  integration_http_method = "POST"
  type          = "AWS_PROXY"
  uri           = aws_lambda_function.upload_handler.invoke_arn
}

# Lambda permission for API Gateway to invoke the function
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.docflow.execution_arn}/*/*"
}
