# First run: step by step

Follow these steps in order, from the repository root. Each step ends with a **Check** you can run. Don't move on until the check passes. Background and troubleshooting are in [DEPLOYMENT.md](DEPLOYMENT.md).

**Time:** about 30 minutes, about 10 of which is the first pipeline run.
**Cost:** AWS charges start when step 7 succeeds, about $21/month. Step 10 removes everything.

Where each step runs:
- 💻 runs on your Mac
- 🐙 happens on GitHub
- 🤖 happens automatically

---

## 1. 💻 Install the tools

```bash
brew install awscli terraform gh jq
brew install --cask session-manager-plugin   # optional: shell access to the server later
```

**Check:**
```bash
aws --version          # aws-cli/2.x
terraform version      # 1.10 or newer
gh --version
```

## 2. 💻 Get working AWS admin credentials

On this Mac, the profiles `default` and `ahmedaleem` both return `InvalidClientTokenId`, which means their keys are revoked or wrong. Replace them with one of the following options.

**Option A: IAM user access key** (simplest)
1. In the AWS console, go to **IAM → Users → (your admin user, not the root user) → Security credentials → Create access key → Command Line Interface**.
2. Configure a profile with the new key:
   ```bash
   aws configure --profile job-board-admin   # paste the key ID and secret; region: us-east-1; output: json
   export AWS_PROFILE=job-board-admin
   ```

**Option B: IAM Identity Center (SSO)**
```bash
aws configure sso --profile job-board-admin
aws sso login --profile job-board-admin
export AWS_PROFILE=job-board-admin
```

Keep `export AWS_PROFILE=job-board-admin` set in every terminal you use for steps 4–9.

**Check:**
```bash
aws sts get-caller-identity   # prints your account ID and an ARN, not an error
```

You only need these admin credentials for the one-time bootstrap (step 5) and for teardown. The pipeline itself never uses them. It signs in to AWS through GitHub's OIDC tokens.

## 3. 💻 Review the settings

Open `terraform/production.tfvars`. The defaults are:

```hcl
aws_region        = "us-east-1"
github_repository = "aleemotless/job-board"
```

You can change `aws_region` or uncomment `instance_type`. Leave the domain lines commented out for the first run; HTTPS can be added later.

**Check:**
```bash
grep -E '^(aws_region|github_repository)' terraform/production.tfvars
```

## 4. 💻🐙 Open a pull request with the deployment code

All of this work is uncommitted on `main`. Put it on a branch so CI checks it before anything touches AWS.

```bash
git switch -c setup-deployment
git add -A
git status --short
```

Read the `git status` list before committing.
- It **must not** contain `backend.hcl`, `.terraform/`, `*.tfstate` or any `.env` file. They're git-ignored, so they shouldn't appear.
- It **must** contain `next.config.ts`, because the Docker build needs `output: "standalone"`.

```bash
git commit -m "Add Terraform + GitHub Actions deployment to AWS EC2"
git push -u origin setup-deployment
gh pr create --fill
```

🤖 CI runs four jobs on the PR: lint/build/smoke test, shellcheck, Terraform validate/tests, and Docker build. None of them uses AWS.

**Check:**
```bash
gh pr checks --watch   # wait until all checks pass
```

## 5. 💻 Bootstrap AWS and GitHub (once)

```bash
terraform/bootstrap.sh
```

The script does three things:
1. Creates the Terraform state bucket.
2. Shows a Terraform plan for the GitHub OIDC provider and the `job-board-github-terraform` role. Read the plan and type `yes`.
3. Sets two GitHub repository variables.

The run is safe to repeat if it stops partway.

Expected output ends with:
```
GitHub variables set on aleemotless/job-board.
Bootstrap complete. ...
```

**Check:**
```bash
gh variable list                                    # AWS_REGION and AWS_TERRAFORM_ROLE_ARN
aws iam get-role --role-name job-board-github-terraform --query Role.Arn --output text
```

## 6. 🐙 Protect `main`

From now on, every push to `main` changes AWS. Require pull requests and passing checks before anything reaches `main`:

```bash
gh api -X PUT repos/aleemotless/job-board/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint, build & smoke test",
      "Shellcheck deploy scripts",
      "Terraform fmt, validate & offline tests",
      "Docker image builds"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
EOF
```

`required_approving_review_count` is 0 so you can merge your own PRs. Raise it when other people work on the repo.

**Check:**
```bash
gh api repos/aleemotless/job-board/branches/main/protection --jq '.required_status_checks.contexts'
```

## 7. 🐙🤖 Merge: the first deployment

```bash
gh pr merge --squash --delete-branch
git switch main && git pull
sleep 15   # give GitHub a moment to start the run
gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

🤖 The Deploy workflow runs these jobs:

| Job | First-run time | What it does |
| --- | --- | --- |
| checks | ~3 min | lint, build, tests (same as CI) |
| Terraform plan & apply | ~3–5 min | creates the VPC, EC2, Elastic IP, ECR, IAM roles, logs and parameters. The run summary lists them. |
| Build & push image | ~3–5 min | builds the Docker image and pushes it to ECR |
| Deploy to EC2 | ~3–6 min | waits for the new server to finish its first-boot setup, releases, checks the public URL |

If a job fails, open the run with `gh run view --log-failed` and look the error up in [DEPLOYMENT.md → Troubleshooting](DEPLOYMENT.md#troubleshooting). Fix the problem, then re-run with `gh run rerun --failed`. Re-running is safe: Terraform and the release scripts pick up where they left off.

**Check:** the run is green, and its summary says `✅ Deployed <sha> to http://<ip>`.

## 8. 💻 Verify the site

```bash
URL=$(aws ssm get-parameter --name /job-board/deploy-config --query Parameter.Value --output text | jq -r .app_url)
echo "$URL"
curl -s "$URL/api/health"; echo     # {"status":"ok","version":"<sha>"}
git rev-parse HEAD                   # same <sha> as above
open "$URL"                          # "Welcome to the Job Board"
```

Optional: open a shell on the server, which needs the plugin from step 1.

```bash
aws ssm start-session --target "$(aws ssm get-parameter --name /job-board/deploy-config --query Parameter.Value --output text | jq -r .instance_id)"
sudo docker ps    # job-board-blue (or -green) and job-board-proxy are Up
exit
```

**Check:** `/api/health` returns the SHA of `main`.

## 9. 🐙🤖 Recommended: rehearse a normal release and a rollback

1. Make a visible change on a branch, for example the heading text in `app/page.tsx`. Open a PR and merge it once checks pass.
   🤖 This time Terraform reports *no infrastructure changes*, and only the app is released.
2. Roll back to the previous release, then confirm the health check shows the previous SHA:
   ```bash
   gh workflow run deploy.yml -f action=rollback
   sleep 15
   gh run watch "$(gh run list --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
   curl -s "$URL/api/health"; echo
   ```
3. Return to the latest code:
   ```bash
   gh workflow run deploy.yml -f image_tag="$(git rev-parse HEAD)"
   ```

**Check:** the site showed the new heading, then the old one, then the new one again.

## 10. 💻 Afterwards

**Secure your admin credentials.** You don't need them again until you change the bootstrap or tear everything down. If you used an access key (option A in step 2), deactivate it:

```bash
aws iam list-access-keys --query 'AccessKeyMetadata[].[AccessKeyId,Status]' --output text
aws iam update-access-key --access-key-id <AKIA...> --status Inactive   # reactivate later if needed
```

**Next steps**, all covered in [DEPLOYMENT.md](DEPLOYMENT.md):
- Add app secrets: [Application environment variables and secrets](DEPLOYMENT.md#application-environment-variables-and-secrets).
- Add a domain with HTTPS: [HTTPS and a custom domain](DEPLOYMENT.md#https-and-a-custom-domain-optional).
- Stop all AWS charges: [Infrastructure lifecycle → destroy](DEPLOYMENT.md#infrastructure-lifecycle).
