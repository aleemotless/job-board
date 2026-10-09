output "app_url" {
  description = "Public URL of the application."
  value       = local.app_url
}

output "public_ip" {
  description = "Elastic IP of the instance (point your domain's A record here if Route 53 isn't managed by Terraform)."
  value       = aws_eip.app.public_ip
}

output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.app.id
}

output "ecr_repository_url" {
  description = "ECR repository the pipeline pushes to."
  value       = aws_ecr_repository.app.repository_url
}

output "log_group" {
  description = "CloudWatch log group for app, proxy and deploy-command output."
  value       = aws_cloudwatch_log_group.app.name
}

output "deploy_config_parameter" {
  description = "SSM parameter holding the pipeline's deployment settings."
  value       = aws_ssm_parameter.deploy_config.name
}

output "app_env_parameter_path" {
  description = "Put app environment variables/secrets under this SSM path (SecureString)."
  value       = local.env_parameter_path
}

output "github_deploy_role_arn" {
  description = "Role the pipeline's image and deploy jobs assume (passed between jobs automatically)."
  value       = aws_iam_role.github_deploy.arn
}

output "ssm_session_command" {
  description = "Open a shell on the instance without SSH."
  value       = "aws ssm start-session --region ${var.aws_region} --target ${aws_instance.app.id}"
}

output "aws_region" {
  description = "Region of the stack."
  value       = var.aws_region
}
