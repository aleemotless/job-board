# One-time bootstrap (run by ../bootstrap.sh): the identity the pipeline uses to
# run Terraform. It can't be created by the pipeline itself, and keeping it in a
# separate state means the pipeline can never modify its own permissions.

terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {} # same bucket as the main stack, key bootstrap.tfstate
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.app_name
      ManagedBy = "terraform-bootstrap"
    }
  }
}

variable "aws_region" {
  type = string
}

variable "app_name" {
  type    = string
  default = "job-board"
}

variable "github_repository" {
  description = "\"owner/name\" of the repository whose pipeline may run Terraform."
  type        = string
}

variable "deploy_branch" {
  type    = string
  default = "main"
}

variable "create_github_oidc_provider" {
  description = "false when the account already has the GitHub OIDC provider (one per account)."
  type        = bool
  default     = true
}

data "aws_partition" "current" {}
data "aws_caller_identity" "current" {}

locals {
  oidc_host    = "token.actions.githubusercontent.com"
  iam_prefix   = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}"
  oidc_arn     = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
  role_name    = "${var.app_name}-github-terraform"
  role_arn     = "${local.iam_prefix}:role/${local.role_name}"
  state_bucket = "${var.app_name}-tfstate-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url            = "https://${local.oidc_host}"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1

  url = "https://${local.oidc_host}"
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only pipeline runs on the deploy branch; never PRs, forks, other branches or tags.
    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/${var.deploy_branch}"]
    }
  }
}

resource "aws_iam_role" "terraform" {
  name                 = local.role_name
  description          = "Runs the ${var.app_name} Terraform stack from GitHub Actions (${var.github_repository}@${var.deploy_branch})"
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

# Broad service access (EC2, VPC, ECR, SSM, CloudWatch, Route 53, S3 state)...
resource "aws_iam_role_policy_attachment" "power_user" {
  role       = aws_iam_role.terraform.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/PowerUserAccess"
}

# ...but IAM only for this project's roles, and nothing on itself.
data "aws_iam_policy_document" "iam" {
  statement {
    sid     = "ManageProjectIam"
    actions = ["iam:*"]
    resources = [
      "${local.iam_prefix}:role/${var.app_name}-*",
      "${local.iam_prefix}:instance-profile/${var.app_name}-*",
    ]
  }

  statement {
    sid       = "ReadGithubOidcProvider"
    actions   = ["iam:GetOpenIDConnectProvider", "iam:ListOpenIDConnectProviders"]
    resources = ["*"]
  }

  statement {
    sid         = "NoSelfModification"
    effect      = "Deny"
    not_actions = ["iam:Get*", "iam:List*"]
    resources   = [local.role_arn]
  }

  # The pipeline may read/write the main state, but not the bootstrap state
  # (this file's) or the bucket's protections.
  statement {
    sid       = "ProtectBootstrapState"
    effect    = "Deny"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${local.state_bucket}/bootstrap.tfstate*"]
  }

  statement {
    sid    = "ProtectStateBucket"
    effect = "Deny"
    actions = [
      "s3:DeleteBucket",
      "s3:DeleteBucketPolicy",
      "s3:PutBucketPolicy",
      "s3:PutBucketVersioning",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutLifecycleConfiguration",
    ]
    resources = ["arn:${data.aws_partition.current.partition}:s3:::${local.state_bucket}"]
  }
}

resource "aws_iam_role_policy" "iam" {
  name   = "project-iam"
  role   = aws_iam_role.terraform.id
  policy = data.aws_iam_policy_document.iam.json
}

output "terraform_role_arn" {
  description = "GitHub Actions variable AWS_TERRAFORM_ROLE_ARN."
  value       = aws_iam_role.terraform.arn
}
