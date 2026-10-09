# Offline checks of the pipeline's Terraform role (mocked AWS, no credentials).

mock_provider "aws" {
  mock_data "aws_partition" {
    defaults = { partition = "aws" }
  }
  mock_data "aws_caller_identity" {
    defaults = { account_id = "123456789012" }
  }
  mock_data "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
  }
  mock_data "aws_iam_policy_document" {
    defaults = { json = "{}" }
  }
  mock_resource "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
  }
}

variables {
  aws_region        = "us-east-1"
  github_repository = "aleemotless/job-board"
}

run "trusts_only_main_and_cannot_modify_itself" {
  command = plan

  assert {
    condition = anytrue([for c in data.aws_iam_policy_document.trust.statement[0].condition :
    c.variable == "token.actions.githubusercontent.com:sub" && c.values == tolist(["repo:aleemotless/job-board:ref:refs/heads/main"])])
    error_message = "Role must trust only the main branch of the repository."
  }
  assert {
    condition = anytrue([for st in data.aws_iam_policy_document.iam.statement :
    st.effect == "Deny" && contains(st.resources, "arn:aws:iam::123456789012:role/job-board-github-terraform")])
    error_message = "Role must deny modifying itself."
  }
  assert {
    condition     = length(aws_iam_openid_connect_provider.github) == 1
    error_message = "Creates the OIDC provider by default."
  }
}

run "reuses_existing_oidc_provider" {
  command = plan

  variables {
    create_github_oidc_provider = false
  }

  assert {
    condition     = length(aws_iam_openid_connect_provider.github) == 0
    error_message = "Must not create a second OIDC provider."
  }
}

run "immutable_subject_prefix" {
  command = plan

  variables {
    github_oidc_subject_prefix = "repo:aleemotless@338228696/job-board@1411882371"
  }

  assert {
    condition = anytrue([for c in data.aws_iam_policy_document.trust.statement[0].condition :
    c.variable == "token.actions.githubusercontent.com:sub" && c.values == tolist(["repo:aleemotless@338228696/job-board@1411882371:ref:refs/heads/main"])])
    error_message = "Trust must use the configured subject prefix."
  }
}
