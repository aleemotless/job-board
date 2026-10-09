variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Name prefix for every resource, the ECR repository, SSM paths and on-host directories."
  type        = string
  default     = "job-board"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.app_name))
    error_message = "Use 2-31 lowercase letters, digits or hyphens, starting with a letter."
  }
}

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as \"owner/name\"."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Must look like \"owner/repo\"."
  }
}

variable "deploy_branch" {
  description = "Only workflows running on this branch can assume the deploy role."
  type        = string
  default     = "main"
}

variable "instance_type" {
  description = "EC2 instance type (x86_64). t3.small (2 GiB) leaves headroom for two app containers during a deploy."
  type        = string
  default     = "t3.small"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size (GiB)."
  type        = number
  default     = 20
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet that hosts the instance."
  type        = string
  default     = "10.20.1.0/24"
}

variable "allowed_http_cidrs" {
  description = "IPv4 CIDRs allowed to reach ports 80/443."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_allowed_cidrs" {
  description = "IPv4 CIDRs allowed to SSH. Empty (default) means no SSH ingress; use SSM Session Manager instead."
  type        = list(string)
  default     = []

  validation {
    condition     = !contains(var.ssh_allowed_cidrs, "0.0.0.0/0")
    error_message = "Refusing to open SSH to the whole internet."
  }
}

variable "ssh_key_name" {
  description = "Existing EC2 key pair name, only needed together with ssh_allowed_cidrs."
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Optional domain (e.g. jobs.example.com). When set, Caddy obtains a Let's Encrypt certificate and serves HTTPS."
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Optional Route 53 hosted zone ID; when set with domain_name, an A record is created. Otherwise point DNS at the public IP yourself."
  type        = string
  default     = ""
}

variable "acme_email" {
  description = "Optional contact email for Let's Encrypt expiry notices."
  type        = string
  default     = ""
}

variable "caddy_image" {
  description = "Reverse proxy image run on the instance."
  type        = string
  default     = "caddy:2.11-alpine"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for app, proxy and deploy logs."
  type        = number
  default     = 14
}

variable "ecr_images_to_keep" {
  description = "Number of most recent images the ECR lifecycle policy keeps."
  type        = number
  default     = 15
}

variable "tags" {
  description = "Extra tags applied to every resource."
  type        = map(string)
  default     = {}
}
