variable "bucket_name" {
  default = "docflow-uploads"
}

variable "table_name" {
  default = "Documents"
}

variable "api_name" {
  default = "docflow-api"
}

variable "cluster_name" {
  default = "docflow"
}

variable "worker_image_tag" {
  default = "latest"
}

variable "worker_host" {
  description = "Address the worker container uses to reach local Postgres and Floci"
  default     = "host.docker.internal"
}

variable "worker_database_name" {
  description = "Database name used in the worker DATABASE_URL"
  default     = "docflow"
}
