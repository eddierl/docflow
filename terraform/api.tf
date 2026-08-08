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

# MOCK integration placeholder — Lambda will be wired in Step 2
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

resource "aws_api_gateway_integration" "documents_post_integration" {
  rest_api_id   = aws_api_gateway_rest_api.docflow.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = aws_api_gateway_method.documents_post.http_method
  type          = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 201
    })
  }
}

resource "aws_api_gateway_deployment" "docflow" {
  rest_api_id = aws_api_gateway_rest_api.docflow.id

  depends_on = [
    aws_api_gateway_integration.documents_get_integration,
    aws_api_gateway_integration.documents_post_integration,
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
