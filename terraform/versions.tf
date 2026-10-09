terraform {
  # 1.10+ for S3-native state locking (use_lockfile).
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Settings come from backend.hcl (see backend.hcl.example):
  #   terraform init -backend-config=backend.hcl
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge({
      Project   = var.app_name
      ManagedBy = "terraform"
    }, var.tags)
  }
}

data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}
