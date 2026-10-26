# Staging settings: a second, fully separate copy of the production stack (own
# VPC, EC2, ECR, IAM roles, SSM paths, logs and state). Deployed by pushes to the
# `staging` branch. No secrets here; app secrets go in SSM under /job-board-staging/env/.

aws_region        = "us-east-1" # must match the AWS_REGION repository variable
github_repository = "aleemotless/job-board"

# Same OIDC subject format as production (see production.tfvars).
github_oidc_subject_prefix = "repo:aleemotless@338228696/job-board@1411882371"

# Distinct name prefix keeps every resource, SSM path and on-host directory apart
# from production. Must stay "job-board-*": the pipeline's Terraform role may only
# manage IAM roles with that prefix. If changed, also update deploy.yml.
app_name      = "job-board-staging"
deploy_branch = "staging"

# Same size as production so staging catches memory issues during a release
# switch. t3.micro halves the EC2 cost but 1 GiB is tight for two Node processes.
instance_type = "t3.small"

# Own address space, so the two VPCs could be peered later without overlap.
vpc_cidr           = "10.21.0.0/16"
public_subnet_cidr = "10.21.1.0/24"

log_retention_days = 7
ecr_images_to_keep = 10

# Domains on Cloudflare (proxied), like production. One label only:
# Cloudflare's Universal SSL covers *.limitlezz.online, not *.staging.limitlezz.online.
# proxy.ts treats admin-* hosts as the admin dashboard.
domain_name        = "joblezz-staging.limitlezz.online" # user site; the pipeline's health check URL
extra_domain_names = ["admin-staging.limitlezz.online"]

tags = { Environment = "staging" }
