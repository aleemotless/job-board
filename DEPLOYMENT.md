# Deployment

The app runs on a single AWS EC2 instance. Every push to `main` runs one GitHub Actions pipeline that:
1. runs the checks;
2. runs Terraform, which creates or updates the infrastructure only when something changed;
3. builds a Docker image;
4. releases it to the instance.

Nobody needs SSH, and nobody configures the server by hand. The only manual step is a one-time bootstrap that creates the identity the pipeline signs in to AWS with.

```
 push to main
     │
     ▼
 GitHub Actions ── CI: npm ci → lint → next build → smoke test → terraform validate/test
     │  (OIDC → short-lived AWS credentials, no stored keys)
     ├─ terraform plan ── changes? ──▶ terraform apply  (VPC, EC2, IAM, ECR, logs, …; state in S3)
     ├─ docker build (standalone output) ──push──▶ Amazon ECR  (tag = git SHA, immutable)
     └─ SSM Run Command ─────────────────────────▶ EC2 (Amazon Linux 2023, Docker)
                                                   ├─ job-board-proxy  Caddy :80/:443
                                                   ├─ job-board-blue   ┐ one is live, the other is
                                                   └─ job-board-green  ┘ the stopped previous release
        then GitHub checks https?://<app>/api/health returns the new version (rolls back if not)
```

| Path | Purpose |
| --- | --- |
| `Dockerfile`, `.dockerignore` | Multi-stage image from `output: "standalone"`. Runs as non-root user `nextjs` (uid 1001). |
| `app/api/health/route.ts` | Health endpoint. Returns `{"status":"ok","version":"<git sha>"}`. |
| `.nvmrc` | Node major version for CI. The `Dockerfile`'s `NODE_VERSION` should match it. |
| `deploy/ssm-deploy.sh` | Runs in GitHub Actions. Sends the release to the instance via SSM, waits, checks the public URL, and triggers a rollback if the check fails. |
| `deploy/remote-deploy.sh` | Runs on the instance. Does the blue/green switch and the rollback. It is sent with every deploy, so changes take effect without touching the instance. |
| `terraform/` | VPC, security group, EC2, Elastic IP, IAM, GitHub OIDC, ECR, CloudWatch Logs, SSM parameters, and an optional Route 53 hosted zone and records. |
| `terraform/production.tfvars` | Production settings (region, repository, instance size, optional domain). Committed and contains no secrets, so infrastructure changes are reviewed in PRs. |
| `terraform/bootstrap.sh`, `terraform/bootstrap/` | One-time bootstrap: creates the state bucket, the GitHub OIDC provider and the role the pipeline uses for Terraform, and sets the GitHub variables. |
| `terraform/tests/`, `terraform/bootstrap/tests/` | Offline `terraform test` checks that use a mocked AWS provider. |
| `.github/workflows/ci.yml` | PR checks: lint, build, smoke test, shellcheck, Terraform validate/test and Docker build. The deploy workflow reuses it. |
| `.github/workflows/deploy.yml` | Push to `main`: checks, then Terraform plan/apply, then image, then deploy and verify. Also has manual rollback, redeploy and replace-instance options. |

## How a release works

1. **CI** (`ci.yml`): `npm ci`, `npm run lint`, `npm run build` (which also type-checks). Then the standalone server is started and `/api/health` and `/` are fetched. The repo has no unit tests yet. Add a `test` script and a step here when it does.
2. **Infrastructure**: the pipeline assumes the Terraform role through OIDC and runs `terraform plan -var-file=production.tfvars` against the S3 state.
   - If there are no changes, which is the normal case for app-only commits, nothing is applied.
   - Otherwise it applies exactly the saved plan, and the run summary lists the changed resources.
   - On the first run this step creates everything, including a new instance.
   - The step then passes the deploy role ARN to the next jobs.
3. **Image**: the workflow assumes the least-privilege deploy role through OIDC and reads the deployment settings from SSM Parameter Store (`/job-board/deploy-config`, written by Terraform). It then builds `linux/amd64` and pushes `<ecr>/job-board:<sha>`. If that tag already exists, for example on a re-run, it skips the build. `NEXT_DEPLOYMENT_ID=<sha>` is set at build time, so browsers still on the old build do a full reload instead of requesting missing chunks.
4. **Deploy**: `ssm-deploy.sh` first waits for the SSM agent, which can take a few minutes on a new instance. It then sends `remote-deploy.sh` to the instance with `AWS-RunShellScript`. On the instance, the script:
   - pulls the image and writes `/etc/job-board/app.env` (mode 0600) from SSM parameters under `/job-board/env/`;
   - starts the new release in the idle slot (`127.0.0.1:3001` or `:3002`) and waits up to 90s for `/api/health` to report the new version;
   - if the release is unhealthy, removes it and exits non-zero. **The live release keeps serving.**
   - if it is healthy, rewrites the Caddyfile and runs `caddy reload` (a graceful reload with no dropped connections), waits 5s for in-flight requests, then stops the old container. The old container is **kept** for rollback.
5. **Verify**: GitHub Actions checks `<app_url>/api/health` (up to about 2.5 minutes) and requires the new SHA. If that check fails after the switch, it runs `rollback` on the instance and the workflow fails.

The workflow-level `concurrency` group allows only one production run (Terraform and release) at a time. The S3 state lock protects against a parallel local `terraform apply`, and the instance also takes a `flock` lock. A newer push waits; it doesn't cancel a release that is mid-switch.

Tested locally in a Docker-in-Docker Linux host: 9,071 requests sent during a release switch all returned 200. This is not tested on AWS.

---

## One-time setup

> First time? Follow the step-by-step checklist in [FIRST_RUN.md](FIRST_RUN.md). This section explains what each step does.

The pipeline can't create the IAM role it signs in with, and Terraform can't create the bucket that holds its own state. So these are created once, from your machine, by `terraform/bootstrap.sh`. Everything else is created by the pipeline.

You need:
- An AWS account, with admin credentials on your machine, used only for this step.
- AWS CLI v2, Terraform ≥ 1.10, and the `gh` CLI logged in with admin access to the repository.

### 1. Review the settings *(edit and commit)*

`terraform/production.tfvars` already has `aws_region = "us-east-1"` and `github_repository = "aleemotless/job-board"`. Change the region or instance size there if you want to.

### 2. Bootstrap *(local, once per account; safe to re-run)*

```bash
terraform/bootstrap.sh
```

This script:
- creates the state bucket `job-board-tfstate-<account>-<region>`, with versioning, encryption and public access blocked;
- applies `terraform/bootstrap/`, after showing the plan and asking you to confirm. This creates the GitHub OIDC provider (or reuses an existing one) and the role `job-board-github-terraform`;
- sets two GitHub repository **variables**, `AWS_REGION` and `AWS_TERRAFORM_ROLE_ARN`. They aren't secrets. If `gh` isn't available, the script prints them for you to add under **Settings → Secrets and variables → Actions → Variables**.

You need no GitHub secrets. AWS accepts the OIDC token only from `repo:aleemotless/job-board:ref:refs/heads/main`. Pull requests, forks, other branches and tags cannot assume either role.

### 3. First run *(automatic)*

Push to `main`, or start the run by hand with `gh workflow run deploy.yml --ref main`, then follow it with `gh run watch`.

The first run takes about 10 minutes:
- Terraform creates the VPC, instance, Elastic IP, ECR, IAM, logs and parameters;
- the image is built;
- the deploy waits for the new instance to finish installing Docker (`cloud-init status --wait`), then releases.

The run summary shows the URL. It is also the `app_url` output of `terraform output`.

### 4. Protect `main` *(GitHub settings)*

Anyone who can push to `main` can change the infrastructure and deploy. Add a branch protection rule or ruleset for `main` that requires pull requests, reviews and the `CI` checks.

---

## Everyday workflow

- **Pull request**: `CI` runs lint, build, smoke test, shellcheck, Terraform validate/offline tests and a Docker build. It has no AWS access, so it doesn't run `terraform plan`. Review `production.tfvars` and `*.tf` diffs carefully.
- **Push or merge to `main`**: `Deploy` runs checks, then Terraform plan (and apply if needed), then the image, then deploy and verify. A failure at any step stops the run. A Terraform failure stops it before anything is released. The run summary shows the Terraform changes and the outcome.
- **Change infrastructure**: edit `terraform/*.tf` or `production.tfvars` in a PR and merge it. The pipeline applies the change, then deploys.
- **Roll back**: **Actions → Deploy → Run workflow → action: `rollback`**. This switches back to the previous (stopped) release. Or run `gh workflow run deploy.yml -f action=rollback`.
- **Redeploy a specific build**: `gh workflow run deploy.yml -f image_tag=<git-sha>`. The image must still be in ECR, which keeps the last 15.
- **Replace the instance** (for example, to pick up the latest Amazon Linux AMI): `gh workflow run deploy.yml -f replace_instance=true`. Terraform recreates the instance, which keeps the Elastic IP, and the release goes onto the new one. Expect a few minutes of downtime.

Rollback skips Terraform plan/apply. It only reads Terraform outputs.

## Application environment variables and secrets

The app reads none today. To add one, put it in SSM Parameter Store under `/job-board/env/` as a `SecureString` and redeploy. The parameter name becomes the variable name.

```bash
aws ssm put-parameter --name /job-board/env/DATABASE_URL --type SecureString --value '...' --overwrite
gh workflow run deploy.yml --ref main
```

- The values never pass through GitHub, Terraform state or user data. The instance role decrypts them at deploy time into a root-only `0600` file.
- Server code reads them at runtime with `process.env.X`. Under Cache Components, read them after `await connection()` or another request-time API.
- `NEXT_PUBLIC_*` variables are inlined at **build** time. They would have to be passed as Docker build args in `deploy.yml`. Never put secrets in them.
- Values can't contain newlines. The env file is one variable per line.

## HTTPS and a custom domain *(optional)*

This is configured for `limitlezz.online`, which is registered at GoDaddy and was on Cloudflare DNS. It's done in two merges, because Let's Encrypt only issues a certificate once the domain resolves to the server.

**1. DNS in Route 53.** Already set in `production.tfvars`:
```hcl
route53_zone_name = "limitlezz.online"
dns_names         = ["limitlezz.online", "www.limitlezz.online"]
```
Merging this creates the hosted zone, A records for the apex and `www` pointing at the Elastic IP, and a CAA record that allows only Let's Encrypt/ZeroSSL. The site keeps serving plain HTTP. The Deploy run summary lists the four **Route 53 nameservers**. They also appear in the `route53_name_servers` output.

**2. Delegate the domain** *(manual, at the registrar)*. In GoDaddy, go to **My Products → limitlezz.online → DNS → Nameservers → Change → "I'll use my own nameservers"**. Replace the Cloudflare nameservers with the four Route 53 ones.

From then on, Route 53 answers for the domain. Anything still configured in the Cloudflare zone stops working, including its proxy and records. To check propagation (usually minutes, at most 48 hours):

```bash
dig +short NS limitlezz.online @8.8.8.8      # the four awsdns-* servers
dig +short A limitlezz.online @8.8.8.8       # the Elastic IP
dig +short A www.limitlezz.online @1.1.1.1   # the Elastic IP
```

Once delegated, `http://limitlezz.online` already reaches the app.

**3. Turn on HTTPS.** Uncomment `domain_name` and `domain_aliases` (and optionally `acme_email`) in `production.tfvars` and merge.
- Caddy obtains certificates for both names and redirects HTTP to HTTPS.
- `www` redirects permanently to `https://limitlezz.online`.
- HTTP/3 (UDP 443) is opened.
- The pipeline's health check moves to `https://limitlezz.online`.

If you do step 3 before DNS points at the server, the deploy fails its public check and rolls back. Re-run it once DNS resolves.

For a domain whose zone is managed elsewhere in Route 53, set `route53_zone_id` instead of `route53_zone_name`. If DNS isn't in Route 53 at all, leave both empty and create the A records at your DNS provider. Certificates are kept in the `job-board-caddy-data` Docker volume, so redeploys don't request new ones.

## Verifying and inspecting

```bash
curl -s "$(terraform -chdir=terraform output -raw app_url)/api/health"   # {"status":"ok","version":"<sha>"}
gh run list --workflow deploy.yml                                         # pipeline history
gh run view --log-failed                                                  # logs of a failed run
```

**Logs** are in CloudWatch Logs group `/job-board/app`, kept for 14 days:

| Stream | Content |
| --- | --- |
| `app/<sha>/<slot>` | Next.js server output |
| `proxy` | Caddy |
| `<command-id>/<instance-id>/aws-runShellScript/stdout` | full output of each deploy command |

```bash
aws logs tail /job-board/app --follow --region us-east-1
```

**Shell on the instance** (no SSH or open port; needs the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)):

```bash
$(terraform -chdir=terraform output -raw ssm_session_command)
sudo docker ps -a                          # live slot is Up; previous slot is Exited
sudo cat /var/lib/job-board/active-slot
sudo docker logs --tail 100 job-board-blue
sudo cat /etc/job-board/caddy/Caddyfile
sudo cat /var/log/cloud-init-output.log    # first-boot bootstrap
```

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `Set the AWS_REGION and AWS_TERRAFORM_ROLE_ARN repository variables` | The bootstrap hasn't run, or `gh` couldn't set the variables. Run `terraform/bootstrap.sh`. |
| `aws_region in production.tfvars … differs from the AWS_REGION variable` | The region selects the state bucket. Moving regions means re-running the bootstrap for the new region. Destroy the old stack first (see below). |
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | The role's trust policy doesn't match the token's `sub` claim. Check three things:<br>1. The run was on `main`.<br>2. `github_repository` matches the repo exactly.<br>3. `github_oidc_subject_prefix` in `production.tfvars` equals `gh api repos/<owner>/<repo>/actions/oidc/customization/sub --jq .sub_claim_prefix`. Repos that use GitHub's immutable subject format include IDs, e.g. `repo:owner@123/name@456`.<br>Fix `production.tfvars`, re-run `terraform/bootstrap.sh` (it checks the prefix), then merge so the pipeline updates the deploy role. |
| Terraform `AccessDenied` on `iam:…` | The pipeline role may only manage IAM roles and instance profiles named `job-board-*`. Name new roles accordingly, or widen `terraform/bootstrap/main.tf` and re-run the bootstrap. |
| `Error acquiring the state lock` | Another apply is running, possibly a local one. The pipeline waits 5 minutes. If a crashed run left a lock, run `terraform force-unlock <id>` locally. |
| `SSM agent on i-… is not online` | The instance is stopped or still booting. Or it lost outbound 443 access, so check the security group and route table. Check **Systems Manager → Fleet Manager**. |
| `cloud-init failed` | First-boot bootstrap failed. Read `/var/log/cloud-init-output.log` through a session, then run the workflow with `replace_instance=true`. |
| `new release … is unhealthy` | The app crashed or `/api/health` didn't answer in 90s. The run log shows the container's last 80 lines. Common causes are a missing env parameter or an exception at startup. The old release is still live. |
| Public health check fails, then rolls back | Works on the instance but not from outside. Check that the security group allows your CIDRs and that DNS points at the Elastic IP. In HTTPS mode, check Caddy's certificate in the `proxy` log stream. |
| `no previous release to roll back to` | Nothing older is kept. This happens on the first deploy, and after a failed deploy because the failed release took the standby slot. Redeploy a known-good SHA with `image_tag`. |
| `Image tag … does not exist` | ECR expired it (keeps the last 15). Push or re-run that commit to rebuild it. |
| Disk full | `docker image prune` runs after each deploy and keeps the live and previous images. If the disk still fills, increase `root_volume_size_gb` (it can be resized in place). |

## Infrastructure lifecycle

| Action | How |
| --- | --- |
| Create or update | Merge changes to `terraform/` into `main`. The pipeline plans and applies. |
| Upgrade the OS image | `gh workflow run deploy.yml -f replace_instance=true` |
| Change the pipeline's own permissions or the GitHub repository | Edit `terraform/bootstrap/` or `production.tfvars`, then run `terraform/bootstrap.sh` locally. The pipeline can't modify its own role. |
| Plan locally (read-only check) | `cd terraform && terraform init -backend-config=backend.hcl && terraform plan -var-file=production.tfvars`. `bootstrap.sh` writes `backend.hcl`. |
| Run offline checks | `terraform -chdir=terraform test` and `terraform -chdir=terraform/bootstrap test`, each after `init -backend=false` |
| Destroy everything | See below. Done locally with admin credentials. The pipeline never destroys. |

The instance ignores newer AMIs so routine applies never replace it. Changing `user-data.sh.tftpl` does replace it (`user_data_replace_on_change`), and the same run deploys onto the new instance. Most changes to the host don't need that, because `deploy/remote-deploy.sh` ships with every deploy.

To destroy everything, first stop new deploys (disable the Deploy workflow, or make sure nothing is merged), then:

```bash
cd terraform
terraform init -backend-config=backend.hcl
terraform destroy -var-file=production.tfvars                    # app stack: deletes ECR images and logs
terraform -chdir=bootstrap destroy -var aws_region=us-east-1 -var github_repository=aleemotless/job-board
# optional: empty and delete the state bucket job-board-tfstate-<account>-<region>
```

When destroying the bootstrap stack, pass `-var create_github_oidc_provider=false` if the OIDC provider existed before the bootstrap. Otherwise Terraform deletes it, and other repositories may depend on it.

## Security

- **Network**:
  - Inbound is only TCP 80/443 (plus UDP 443 when serving HTTPS) from `allowed_http_cidrs`.
  - There is no SSH unless you set `ssh_allowed_cidrs`; `0.0.0.0/0` is rejected.
  - Outbound is only TCP 80/443.
  - The app containers listen only on `127.0.0.1` and the private Docker network.
  - The VPC's default security group has its rules removed.
- **Instance**:
  - IMDSv2 is required, with hop limit 1, so containers can't reach the instance credentials.
  - The root volume is encrypted.
  - The app runs as uid 1001 with `--cap-drop ALL` and `no-new-privileges`.
  - The instance role can only use SSM management, pull from this one ECR repo, write to this one log group, and read `/job-board/env/*`.
- **GitHub Terraform role** (`job-board-github-terraform`, used only by the pipeline's infrastructure job):
  - It has `PowerUserAccess`, plus IAM limited to roles and instance profiles named `job-board-*`. That is broad: whoever controls `main` effectively controls most of the AWS account, so branch protection on `main` matters.
  - It can't modify its own role, the bootstrap state, or the state bucket's protections.
  - For an approval gate before applies, put the infrastructure job in a protected GitHub environment and change the role's trusted subject in `terraform/bootstrap/main.tf` to `repo:aleemotless/job-board:environment:<name>`.
- **GitHub deploy role** (used by the image and deploy jobs):
  - It can only push and pull this ECR repo, read the deploy-config parameter, and run `AWS-RunShellScript` on this one instance.
  - Running shell commands is effectively root on the instance. Anyone who can push to `main` can deploy, so protect `main` with branch protection and reviews.
- **Supply chain**: third-party actions are pinned to commit SHAs. The Terraform provider is pinned by `.terraform.lock.hcl`. ECR tags are immutable, and ECR runs a basic vulnerability scan on push.
- **Committed files**: state, `backend.hcl`, `.env*` and any `*.tfvars` other than `production.tfvars` are git-ignored. `production.tfvars` holds no secrets. Terraform outputs, plan summaries and the deploy-config parameter contain no secrets.
- **Information disclosure**: `/api/health` publicly exposes the deployed git SHA.

## Cost (us-east-1 on-demand, approximate)

| Item | ~USD/month |
| --- | --- |
| EC2 `t3.small` (24×7) | 15 |
| 20 GiB gp3 | 1.60 |
| Public IPv4 (Elastic IP) | 3.60 |
| Route 53 hosted zone (+ queries) | 0.50 |
| ECR storage (≤15 images × ~100 MB), CloudWatch Logs, SSM | < 1 |
| **Total** | **≈ $21.50** |

Other notes:
- There's no NAT gateway, load balancer or KMS key.
- The `t3.micro` instance type is free-tier eligible and halves the EC2 cost, but its 1 GiB of memory is tight for two Node processes during a switch.
- The burst credit mode is `standard`, so there are no surprise charges for unlimited bursting.
- Stopping the instance stops the EC2 charges, but the Elastic IP is still billed.

## Limitations

- **One instance, one Availability Zone.** Instance or AZ failure means downtime until AWS recovers it (EC2 auto-recovery is on by default for `t3`) or you replace it. No load balancer, no autoscaling.
- **Short-lived skew during a switch, not "zero downtime" in every case.** The switch is a graceful proxy reload, and local testing dropped no requests. However:
  - first deploys, a Caddy image change, and instance reboots or replacements all cause brief downtime;
  - long streaming responses on the old release are cut off by `docker stop` (30-second grace period) after the 5-second drain.
- **Rollback depth is one.** Only the immediately previous release is kept on the host. A failed deploy uses up the standby slot. Older builds can be redeployed from ECR with `image_tag`.
- **Data is local.** The Next.js cache and Caddy certificates live on this instance. The app has no database. If you add one, use a managed service such as RDS, not the instance disk.
- **OS patching** isn't automated beyond the first boot `dnf upgrade`. Replace the instance periodically (see "Upgrade the OS image" above) or add SSM Patch Manager.
- **x86_64 only.** The AMI lookup and the image platform are `amd64`. ARM (`t4g`) instances would need an arm64 image and AMI.
- **No `terraform plan` on pull requests.** PRs get only offline validation and tests, because giving PRs AWS access would need another read-only role. The plan is visible in the `main` run, just before it is applied.
- **Not verified on AWS.** This setup was validated with `terraform validate` and offline `terraform test`, plus local Docker tests of the release scripts. Neither the bootstrap nor the pipeline has been run against a real account. The bootstrap shows its plan before applying, and the first pipeline run prints the full plan.
