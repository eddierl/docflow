resource "aws_api_gateway_rest_api" "docflow" {
  name = var.api_name

  tags = {
    Name = var.api_name
  }
}

resource "aws_api_gateway_resource" "documents" {
  rest_api_id = aws_api_gateway_rest_api.docflow.id
  parent_id   = aws_api_gateway_rest_api.docflow.root_resource_id
  path_part   = "documents"
}

resource "aws_api_gateway_method" "documents_get" {
  rest_api_id   = aws_api_gateway_rest_api.docflow.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "documents_post" {
  rest_api_id   = aws_api_gateway_rest_api.docflow.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = "POST"
  authorization = "NONE"
}

# GET uses MOCK (no Lambda yet)
resource "aws_api_gateway_integration" "documents_get_integration" {
  rest_api_id   = aws_api_gateway_rest_api.docflow.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = aws_api_gateway_method.documents_get.http_method
  type          = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# POST uses AWS_PROXY → Lambda (real handler)
# Note: documents_post_lambda in lambda.tf handles this

resource "aws_api_gateway_deployment" "docflow" {
  rest_api_id = aws_api_gateway_rest_api.docflow.id

  depends_on = [
    aws_api_gateway_integration.documents_get_integration,
    aws_api_gateway_integration.documents_post_lambda,
  ]

  triggers = {
    redeployment = jsonencode({
      get_method    = aws_api_gateway_method.documents_get.id
      post_method   = aws_api_gateway_method.documents_post.id
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "docflow" {
  rest_api_id   = aws_api_gateway_deployment.docflow.rest_api_id
  deployment_id = aws_api_gateway_deployment.docflow.id
  stage_name    = "dev"
}
