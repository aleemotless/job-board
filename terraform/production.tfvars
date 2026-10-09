# Production settings, committed so infrastructure changes are reviewed in PRs
# and applied by the pipeline. No secrets here: app secrets go in SSM Parameter
# Store (see DEPLOYMENT.md). The pipeline derives region/state bucket from this.

aws_region        = "us-east-1"
github_repository = "aleemotless/job-board"

# app_name      = "job-board"   # if changed, also update APP_NAME in deploy.yml
# deploy_branch = "main"
# instance_type = "t3.small"

# Optional HTTPS: point the domain at the Elastic IP (automatic if route53_zone_id is set).
# domain_name     = "jobs.example.com"
# route53_zone_id = "Z0123456789ABCDEFGHIJ"
# acme_email      = "you@example.com"

# Emergency SSH (prefer `aws ssm start-session`). Never 0.0.0.0/0.
# ssh_allowed_cidrs = ["203.0.113.10/32"]
# ssh_key_name      = "my-key"
