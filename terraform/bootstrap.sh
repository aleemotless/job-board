#!/usr/bin/env bash
# One-time bootstrap, run locally with admin AWS credentials. Idempotent.
#
#   terraform/bootstrap.sh
#
# Creates what the pipeline needs before it can run Terraform itself:
#   1. the S3 bucket holding Terraform state (versioned, encrypted, private)
#   2. bootstrap/: the GitHub OIDC provider and the role the pipeline assumes
#   3. GitHub repository variables AWS_REGION and AWS_TERRAFORM_ROLE_ARN (via gh)
# Region, app name and repository are read from production.tfvars.
set -euo pipefail
cd "$(dirname "$0")"

tfvar() { sed -nE "s/^$1[[:space:]]*=[[:space:]]*\"([^\"]*)\".*/\\1/p" production.tfvars; }
REGION=$(tfvar aws_region)
REPO=$(tfvar github_repository)
APP_NAME=$(tfvar app_name)
APP_NAME=${APP_NAME:-job-board}
[[ -n $REGION && -n $REPO ]] || { echo "Set aws_region and github_repository in production.tfvars" >&2; exit 1; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="${APP_NAME}-tfstate-${ACCOUNT_ID}-${REGION}"
echo "Account ${ACCOUNT_ID}, region ${REGION}, repository ${REPO}"

# --- 1. State bucket ----------------------------------------------------------
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "State bucket ${BUCKET} exists"
else
  echo "Creating state bucket ${BUCKET}"
  if [[ $REGION == us-east-1 ]]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=${REGION}" >/dev/null
  fi
fi
aws s3api put-bucket-versioning --bucket "$BUCKET" --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket "$BUCKET" --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"},"BucketKeyEnabled":true}]}'

write_backend() { # <file> <key>
  printf 'bucket       = "%s"\nkey          = "%s"\nregion       = "%s"\nencrypt      = true\nuse_lockfile = true\n' \
    "$BUCKET" "$2" "$REGION" >"$1"
}
write_backend backend.hcl "${APP_NAME}/production.tfstate" # for local runs of the main stack
write_backend bootstrap/backend.hcl "${APP_NAME}/bootstrap.tfstate"

# --- 2. OIDC provider + pipeline role -----------------------------------------
terraform -chdir=bootstrap init -input=false -reconfigure -backend-config=backend.hcl >/dev/null

# Reuse an OIDC provider that already exists in the account (only one is allowed),
# unless this bootstrap created it.
create_oidc=true
if aws iam list-open-id-connect-providers --output text | grep -q 'token.actions.githubusercontent.com' &&
  ! terraform -chdir=bootstrap state list 2>/dev/null | grep -q '^aws_iam_openid_connect_provider.github'; then
  create_oidc=false
fi

terraform -chdir=bootstrap apply \
  -var "aws_region=${REGION}" -var "app_name=${APP_NAME}" -var "github_repository=${REPO}" \
  -var "create_github_oidc_provider=${create_oidc}"
ROLE_ARN=$(terraform -chdir=bootstrap output -raw terraform_role_arn)

# --- 3. GitHub variables --------------------------------------------------------
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh variable set AWS_REGION --repo "$REPO" --body "$REGION"
  gh variable set AWS_TERRAFORM_ROLE_ARN --repo "$REPO" --body "$ROLE_ARN"
  echo "GitHub variables set on ${REPO}."
else
  echo "gh is not available/authenticated. Set these repository variables in GitHub"
  echo "(Settings > Secrets and variables > Actions > Variables):"
  echo "  AWS_REGION=${REGION}"
  echo "  AWS_TERRAFORM_ROLE_ARN=${ROLE_ARN}"
fi
echo "Bootstrap complete. Push to main (or: gh workflow run deploy.yml --ref main) to create the infrastructure and deploy."
