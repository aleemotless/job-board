# Offline plan checks with a mocked AWS provider (no credentials needed):
#   terraform init -backend=false && terraform test

mock_provider "aws" {
  mock_data "aws_ec2_instance_type_offerings" {
    defaults = { locations = ["us-east-1b", "us-east-1a"] }
  }
  mock_data "aws_ssm_parameter" {
    defaults = { value = "ami-0123456789abcdef0" }
  }
  mock_data "aws_partition" {
    defaults = { partition = "aws" }
  }
  mock_data "aws_caller_identity" {
    defaults = { account_id = "123456789012" }
  }
  mock_data "aws_iam_policy_document" {
    defaults = { json = "{}" }
  }
  mock_data "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
  }
  mock_resource "aws_eip" {
    defaults = { public_ip = "198.51.100.7" }
  }
}

# Same values the pipeline uses.
variables {
  aws_region        = "us-east-1"
  github_repository = "aleemotless/job-board"
}

run "defaults_http_only_no_ssh" {
  command = apply # mocked: computes values without touching AWS

  assert {
    condition     = output.app_url == "http://198.51.100.7"
    error_message = "Without a domain the app should be served over HTTP on the Elastic IP."
  }
  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.ssh) == 0 && length(aws_vpc_security_group_ingress_rule.quic) == 0
    error_message = "No SSH or QUIC ingress by default."
  }
  assert {
    condition     = toset(keys(aws_vpc_security_group_ingress_rule.web)) == toset(["80-0.0.0.0/0", "443-0.0.0.0/0"])
    error_message = "Only 80/443 should be open."
  }
  assert {
    condition     = aws_subnet.public.availability_zone == "us-east-1a"
    error_message = "Should pick the first AZ offering the instance type."
  }
  assert {
    condition     = aws_instance.app.metadata_options[0].http_tokens == "required" && aws_instance.app.metadata_options[0].http_put_response_hop_limit == 1
    error_message = "IMDSv2 with hop limit 1 is required."
  }
  assert {
    condition     = jsondecode(aws_ssm_parameter.deploy_config.value).site_address == ":80"
    error_message = "Deploy config should tell Caddy to serve plain HTTP."
  }
  assert {
    condition     = length(aws_route53_record.app) == 0
    error_message = "Optional resources must be off by default."
  }
  assert {
    condition     = anytrue([for c in data.aws_iam_policy_document.github_deploy_trust.statement[0].condition : c.variable == "token.actions.githubusercontent.com:sub" && c.values == tolist(["repo:aleemotless/job-board:ref:refs/heads/main"])])
    error_message = "Deploy role must trust only the main branch of the repository."
  }
}

run "domain_https" {
  command = apply

  variables {
    domain_name     = "jobs.example.com"
    route53_zone_id = "Z0123456789"
  }

  assert {
    condition     = output.app_url == "https://jobs.example.com"
    error_message = "With a domain the app URL should be HTTPS."
  }
  assert {
    condition     = length(aws_route53_record.app) == 1 && length(aws_vpc_security_group_ingress_rule.quic) == 1
    error_message = "Route 53 record and QUIC rule expected with a domain."
  }
}

run "rejects_world_open_ssh" {
  command = plan

  variables {
    ssh_allowed_cidrs = ["0.0.0.0/0"]
  }

  expect_failures = [var.ssh_allowed_cidrs]
}

run "immutable_subject_prefix" {
  command = plan

  variables {
    github_oidc_subject_prefix = "repo:aleemotless@338228696/job-board@1411882371"
  }

  assert {
    condition = anytrue([for c in data.aws_iam_policy_document.github_deploy_trust.statement[0].condition :
    c.variable == "token.actions.githubusercontent.com:sub" && c.values == tolist(["repo:aleemotless@338228696/job-board@1411882371:ref:refs/heads/main"])])
    error_message = "Deploy role trust must use the configured subject prefix."
  }
}
