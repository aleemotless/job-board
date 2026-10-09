# Dedicated, minimal network: one public subnet, no NAT gateway (no hourly cost).

data "aws_ec2_instance_type_offerings" "available" {
  location_type = "availability-zone"

  filter {
    name   = "instance-type"
    values = [var.instance_type]
  }
}

locals {
  availability_zone = sort(data.aws_ec2_instance_type_offerings.available.locations)[0]
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = var.app_name }
}

# Strip the default security group's rules so nothing can use it accidentally.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.main.id
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = var.app_name }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidr
  availability_zone = local.availability_zone

  tags = { Name = "${var.app_name}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.app_name}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app" {
  name        = "${var.app_name}-web"
  description = "HTTP/HTTPS to the reverse proxy; no SSH unless explicitly allowed"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.app_name}-web" }
}

resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each = {
    for pair in setproduct([80, 443], var.allowed_http_cidrs) : "${pair[0]}-${pair[1]}" => pair
  }

  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = each.value[0]
  to_port           = each.value[0]
  cidr_ipv4         = each.value[1]
}

# HTTP/3 (QUIC), only meaningful when serving HTTPS on a domain.
resource "aws_vpc_security_group_ingress_rule" "quic" {
  for_each = var.domain_name == "" ? toset([]) : toset(var.allowed_http_cidrs)

  security_group_id = aws_security_group.app.id
  ip_protocol       = "udp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = each.value
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each = toset(var.ssh_allowed_cidrs)

  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = each.value
}

# Outbound HTTPS/HTTP only: package repos, ECR, SSM, CloudWatch, Let's Encrypt.
# (DNS and NTP use VPC link-local services, which security groups don't filter.)
resource "aws_vpc_security_group_egress_rule" "web" {
  for_each = toset(["80", "443"])

  security_group_id = aws_security_group.app.id
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  cidr_ipv4         = "0.0.0.0/0"
}
