resource "aws_dynamodb_table" "documents" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"

    key_schema {
      attribute_name = "status"
      key_type       = "HASH"
    }
    projection_type = "ALL"
  }

  tags = {
    Name = "docflow-documents"
  }
}
