# Latest Amazon Linux 2023 at creation time. Later AMI releases are ignored so
# routine applies never replace the instance; see DEPLOYMENT.md to upgrade.
data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  key_name               = length(var.ssh_allowed_cidrs) > 0 ? var.ssh_key_name : null

  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    app_name = var.app_name
  })
  user_data_replace_on_change = true

  metadata_options {
    http_tokens = "required" # IMDSv2 only
    # Hop limit 1: containers on Docker's bridge network cannot reach the
    # instance metadata service, so the app never sees the instance role.
    http_put_response_hop_limit = 1
    http_endpoint               = "enabled"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    encrypted             = true
    delete_on_termination = true
  }

  credit_specification {
    cpu_credits = "standard" # avoid surprise "unlimited" burst charges
  }

  tags = { Name = var.app_name }

  lifecycle {
    ignore_changes = [ami]
  }
}

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  tags = { Name = var.app_name }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.app_name}/app"
  retention_in_days = var.log_retention_days
}

# --- Instance role: SSM management, ECR pull, logs, app env parameters -------

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "${var.app_name}-instance"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "instance_ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "instance" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [aws_ecr_repository.app.arn]
  }

  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"]
    resources = [aws_cloudwatch_log_group.app.arn, "${aws_cloudwatch_log_group.app.arn}:*"]
  }

  statement {
    sid       = "SsmAgentLogOutput"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid     = "ReadAppEnv"
    actions = ["ssm:GetParametersByPath"]
    resources = [
      "${local.ssm_parameter_arn_prefix}${local.env_parameter_path}",
      "${local.ssm_parameter_arn_prefix}${local.env_parameter_path}/*",
    ]
  }
}

resource "aws_iam_role_policy" "instance" {
  name   = "app-runtime"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.instance.json
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.app_name}-instance"
  role = aws_iam_role.instance.name
}
