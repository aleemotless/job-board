#!/usr/bin/env bash
# One-time bootstrap, run locally with admin AWS credentials. Idempotent.
#
#   terraform/bootstrap.sh
#
# Creates what the pipeline needs before it can run Terraform itself:
#   1. the S3 bucket holding Terraform state (versioned, encrypted, private)
#   2. bootstrap/: the GitHub OIDC provider and the role the pipeline assumes
#   3. GitHub repository variables AWS_REGION and AWS_TERRAFORM_ROLE_ARN (via gh)
# Region, app name and repository are read from production.tfvars. Every
# environment (production.tfvars, staging.tfvars) shares the bucket and the role;
# the role trusts each environment's deploy_branch.
set -euo pipefail
cd "$(dirname "$0")"

ENVIRONMENTS=(production staging)

tfvar() { sed -nE "s/^$1[[:space:]]*=[[:space:]]*\"([^\"]*)\".*/\\1/p" "${2:-production}.tfvars"; }
REGION=$(tfvar aws_region)
REPO=$(tfvar github_repository)
APP_NAME=$(tfvar app_name)
APP_NAME=${APP_NAME:-job-board}
[[ -n $REGION && -n $REPO ]] || { echo "Set aws_region and github_repository in production.tfvars" >&2; exit 1; }

# One deploy branch per environment, all sharing this account, region and repository.
BRANCHES=()
for env in "${ENVIRONMENTS[@]}"; do
  [[ -f ${env}.tfvars ]] || continue
  for key in aws_region github_repository github_oidc_subject_prefix; do
    if [[ $(tfvar "$key" "$env") != "$(tfvar "$key")" ]]; then
      echo "${key} in ${env}.tfvars must match production.tfvars" >&2
      exit 1
    fi
  done
  branch=$(tfvar deploy_branch "$env")
  BRANCHES+=("${branch:-main}")
done
BRANCHES_HCL=$(printf '"%s",' "${BRANCHES[@]}")
BRANCHES_HCL="[${BRANCHES_HCL%,}]"

# The role trust must match the "sub" claim GitHub puts in this repo's OIDC tokens,
# which is either classic (repo:owner/name) or immutable (repo:owner@id/name@id).
SUBJECT_PREFIX=$(tfvar github_oidc_subject_prefix)
SUBJECT_PREFIX=${SUBJECT_PREFIX:-repo:${REPO}}
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  actual=$(gh api "repos/${REPO}/actions/oidc/customization/sub" --jq '.sub_claim_prefix // empty' 2>/dev/null || true)
  actual=${actual:-repo:${REPO}}
  if [[ $actual != "$SUBJECT_PREFIX" ]]; then
    echo "GitHub issues OIDC tokens for ${REPO} with subject prefix:" >&2
    echo "  ${actual}" >&2
    echo "Set this in terraform/production.tfvars, then re-run:" >&2
    echo "  github_oidc_subject_prefix = \"${actual}\"" >&2
    exit 1
  fi
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="${APP_NAME}-tfstate-${ACCOUNT_ID}-${REGION}"
echo "Account ${ACCOUNT_ID}, region ${REGION}, repository ${REPO} (OIDC subject ${SUBJECT_PREFIX}), branches ${BRANCHES[*]}"

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
write_backend backend.hcl "${APP_NAME}/production.tfstate" # for local runs of the production stack
write_backend backend-staging.hcl "${APP_NAME}/staging.tfstate"
write_backend bootstrap/backend.hcl "${APP_NAME}/bootstrap.tfstate"

# --- 2. OIDC provider + pipeline role -----------------------------------------
terraform -chdir=bootstrap init -input=false -reconfigure -backend-config=backend.hcl >/dev/null

# Reuse an OIDC provider that already exists in the account (only one is allowed),
# unless this bootstrap created it.
create_oidc=true
providers=$(aws iam list-open-id-connect-providers --output text)
managed=$(terraform -chdir=bootstrap state list 2>/dev/null || true)
if grep -q 'token.actions.githubusercontent.com' <<<"$providers" &&
  ! grep -q '^aws_iam_openid_connect_provider.github' <<<"$managed"; then
  create_oidc=false
fi

terraform -chdir=bootstrap apply \
  -var "aws_region=${REGION}" -var "app_name=${APP_NAME}" -var "github_repository=${REPO}" \
  -var "github_oidc_subject_prefix=${SUBJECT_PREFIX}" \
  -var "deploy_branches=${BRANCHES_HCL}" \
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
echo "Bootstrap complete. Push to main (production) or staging (staging), or run: gh workflow run deploy.yml --ref <branch>"
