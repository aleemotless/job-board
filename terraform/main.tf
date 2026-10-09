locals {
  https                    = var.domain_name != ""
  site_address             = local.https ? var.domain_name : ":80"
  app_url                  = local.https ? "https://${var.domain_name}" : "http://${aws_eip.app.public_ip}"
  env_parameter_path       = "/${var.app_name}/env"
  deploy_config_parameter  = "/${var.app_name}/deploy-config"
  ssm_parameter_arn_prefix = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter"
}

# Everything the pipeline needs to know about the infrastructure, published so
# GitHub only has to be told the role ARN and region. Not secret.
resource "aws_ssm_parameter" "deploy_config" {
  name = local.deploy_config_parameter
  type = "String"
  value = jsonencode({
    app_name           = var.app_name
    instance_id        = aws_instance.app.id
    public_ip          = aws_eip.app.public_ip
    app_url            = local.app_url
    site_address       = local.site_address
    acme_email         = var.acme_email
    ecr_repository_url = aws_ecr_repository.app.repository_url
    log_group          = aws_cloudwatch_log_group.app.name
    env_parameter_path = local.env_parameter_path
    caddy_image        = var.caddy_image
  })
}

resource "aws_route53_record" "app" {
  count = local.https && var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
