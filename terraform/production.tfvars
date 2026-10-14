# Production settings, committed so infrastructure changes are reviewed in PRs
# and applied by the pipeline. No secrets here: app secrets go in SSM Parameter
# Store (see DEPLOYMENT.md). The pipeline derives region/state bucket from this.

aws_region        = "us-east-1"
github_repository = "aleemotless/job-board"

# This repo's GitHub OIDC tokens use the immutable subject format (owner/repo IDs).
# Must match: gh api repos/aleemotless/job-board/actions/oidc/customization/sub --jq .sub_claim_prefix
github_oidc_subject_prefix = "repo:aleemotless@338228696/job-board@1411882371"

# app_name      = "job-board"   # if changed, also update APP_NAME in deploy.yml
# deploy_branch = "main"
# instance_type = "t3.small"

# Domains: limitlezz.online is on Cloudflare DNS, proxied (orange cloud). Only the
# subdomains below are served; each needs a proxied A record to the Elastic IP.
# proxy.ts routes admin.* to the admin dashboard and everything else to the user site.
# Cloudflare's SSL/TLS mode must be "Full (strict)": Caddy terminates TLS with
# Let's Encrypt certificates, obtained via HTTP-01 through the Cloudflare proxy.
# Route 53 is not used (route53_zone_name / dns_names stay unset).
domain_name        = "joblezz.limitlezz.online" # user site; the pipeline's health check URL
extra_domain_names = ["admin.limitlezz.online"]
# acme_email       = "you@example.com"         # optional: certificate expiry notices

# Emergency SSH (prefer `aws ssm start-session`). Never 0.0.0.0/0.
# ssh_allowed_cidrs = ["203.0.113.10/32"]
# ssh_key_name      = "my-key"
