# Optional DNS in Route 53. The zone and its records are independent of
# domain_name, so DNS can be delegated and propagated before HTTPS is switched on.

locals {
  create_zone = var.route53_zone_name != ""
  manage_dns  = local.create_zone || var.route53_zone_id != "" # known at plan time
  zone_id     = local.create_zone ? aws_route53_zone.main[0].zone_id : var.route53_zone_id
}

resource "aws_route53_zone" "main" {
  count = local.create_zone ? 1 : 0

  name          = var.route53_zone_name
  comment       = "${var.app_name}: managed by Terraform"
  force_destroy = false # never silently drop records someone added by hand
}

resource "aws_route53_record" "app" {
  for_each = local.manage_dns ? toset(var.dns_names) : toset([])

  zone_id = local.zone_id
  name    = each.value
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# Only the CAs Caddy uses (Let's Encrypt, with ZeroSSL/Sectigo as fallback) may
# issue certificates for the zone.
resource "aws_route53_record" "caa" {
  count = local.create_zone ? 1 : 0

  zone_id = local.zone_id
  name    = var.route53_zone_name
  type    = "CAA"
  ttl     = 3600
  records = [
    "0 issue \"letsencrypt.org\"",
    "0 issue \"sectigo.com\"",
  ]
}
