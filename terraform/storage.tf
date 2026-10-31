# Applicants' CV files. Private: the app reads and writes them with the instance
# role, and admins download them through the app (/admin/applications/<id>/cv).
resource "aws_s3_bucket" "cvs" {
  bucket_prefix = "${var.app_name}-cvs-" # bucket names are global; AWS appends a unique suffix
  # No force_destroy: CVs are user data, so `terraform destroy` stops at a non-empty bucket.
}

resource "aws_s3_bucket_public_access_block" "cvs" {
  bucket                  = aws_s3_bucket.cvs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "cvs" {
  bucket = aws_s3_bucket.cvs.id
  rule {
    object_ownership = "BucketOwnerEnforced" # ACLs off
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cvs" {
  bucket = aws_s3_bucket.cvs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "cvs_bucket" {
  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.cvs.arn, "${aws_s3_bucket.cvs.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "cvs" {
  bucket = aws_s3_bucket.cvs.id
  policy = data.aws_iam_policy_document.cvs_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.cvs]
}

# Handed to the app as environment variables: remote-deploy.sh loads everything
# under the env path. The SDK picks up credentials from the instance role itself.
resource "aws_ssm_parameter" "cv_bucket" {
  name  = "${local.env_parameter_path}/CV_BUCKET"
  type  = "String"
  value = aws_s3_bucket.cvs.id
}

resource "aws_ssm_parameter" "aws_region" {
  name  = "${local.env_parameter_path}/AWS_REGION"
  type  = "String"
  value = var.aws_region
}
