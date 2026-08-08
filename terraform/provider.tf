terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.58.0" # This forces this specific block to use your active version

    }
  }

  required_version = ">= 1.6"
}


provider "aws" {
  region = "us-east-1"

  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  s3_use_path_style = true

  endpoints {
    s3         = "http://localhost:4566"
    sts        = "http://localhost:4566"
    sqs        = "http://localhost:4566"
    dynamodb   = "http://localhost:4566"
    apigateway = "http://localhost:4566"
  }
}