# Running the app: MongoDB, auth and S3 CV uploads

How to run the job board locally and in staging/production now that it stores data in MongoDB, signs users in with next-auth, and keeps applicants' CVs (PDF only) in S3. Each step ends with a **Check**. Infrastructure setup (bootstrap, pipeline, domains) is in [FIRST_RUN.md](FIRST_RUN.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

**Contents**
1. [What the app needs](#1-what-the-app-needs)
2. [Run it locally](#2-run-it-locally)
3. [Make yourself an admin](#3-make-yourself-an-admin)
4. [Deploy to staging and production](#4-deploy-to-staging-and-production)
5. [Verify a deployment](#5-verify-a-deployment)
6. [Troubleshooting](#6-troubleshooting)
7. [Removing the bucket](#7-removing-the-bucket)

---

## 1. What the app needs

| Variable | What it is | Local | Deployed |
| --- | --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `.env` | SSM `/<app>/env/MONGODB_URI` (you set it) |
| `AUTH_SECRET` | Signs session cookies | `.env` | SSM `/<app>/env/AUTH_SECRET` (you set it) |
| `CV_BUCKET` | S3 bucket for CVs | `.env` | SSM, **set by Terraform** |
| `AWS_REGION` | Region of the bucket | `.env` | SSM, **set by Terraform** |
| AWS credentials | Permission to use the bucket | Your AWS profile, or LocalStack's dummy keys | The EC2 instance role (no keys) |
| `AWS_ENDPOINT_URL_S3` | Only for LocalStack | `.env` | Never set |

`<app>` is `job-board` for production and `job-board-staging` for staging.

How the pieces fit:
- **Uploading.** The apply form posts the PDF to a Server Action. It checks the size, the `.pdf` extension and the reported type, then writes the file to `s3://$CV_BUCKET/cvs/<applicationId>` *before* saving the application in MongoDB.
- **Downloading.** Admins get CVs from `/admin/applications/<id>/cv`. The app reads the file from S3 and sends it as an attachment. The bucket is never public.
- **Deleting** an application, or a job and its applications, removes the files from S3 as well.

---

## 2. Run it locally

**Prerequisites:** Node (version in `.nvmrc`), Docker, and the AWS CLI if you use a real bucket.

```bash
npm ci
```

### 2.1 Pick a database

- **Option A, Atlas.** Use your Atlas connection string. Your current IP must be on the cluster's **Network Access** list, or every request fails with `MongooseServerSelectionError`.
- **Option B, local container** (empty, so seed it in step 2.4):
  ```bash
  docker run -d --name jobboard-mongo -p 27017:27017 mongo:8
  # MONGODB_URI=mongodb://127.0.0.1:27017/jobboard
  ```

### 2.2 Pick where CVs go

**Option A: LocalStack (offline, nothing in AWS)**
```bash
docker run -d --name jobboard-s3 -p 4566:4566 -e SERVICES=s3 localstack/localstack:4.0
docker exec jobboard-s3 awslocal s3 mb s3://cvs
```
This uses the endpoint `http://s3.localhost.localstack.cloud:4566`. That hostname is public DNS pointing at `127.0.0.1`, so the SDK's bucket-style hostnames (`cvs.s3.localhost.localstack.cloud`) work without `/etc/hosts` edits. LocalStack keeps nothing when the container is removed, so create the bucket again after a restart.

**Option B: the real staging bucket** (once staging is deployed with this branch)
```bash
export AWS_PROFILE=job-board-admin    # any identity that can read/write the bucket
aws ssm get-parameter --name /job-board-staging/env/CV_BUCKET --query Parameter.Value --output text
```
Everything you upload locally lands next to staging's real CVs, under the same `cvs/` prefix.

### 2.3 Fill in `.env`

`.env` is gitignored. `next dev`, `next start` and `npm run seed` all read it.

```bash
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/jobboard

# Auth: generate once with `openssl rand -base64 32`
AUTH_SECRET=<random value>

# CVs, LocalStack (option A)
CV_BUCKET=cvs
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL_S3=http://s3.localhost.localstack.cloud:4566

# CVs, real staging bucket (option B): use these instead of the five lines above
# CV_BUCKET=job-board-staging-cvs-<suffix>
# AWS_REGION=us-east-1
# AWS_PROFILE=job-board-admin
```

Don't keep `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` set when using a profile. Keys in the environment win over `AWS_PROFILE`.

### 2.4 Seed and start

```bash
npm run seed      # inserts the sample jobs and applications; refuses if jobs already exist
npm run dev       # http://localhost:3000
```

To run the production build instead:
```bash
npm run build && npm start
```
The build never connects to MongoDB: pages that show data render per request, so only the running app needs the database.

**Check:**
1. Open http://localhost:3000, click **Sign up**, and create an account.
2. Open a job, fill in the form, attach a PDF, and press **Submit application**. You should see "Application sent".
3. Confirm the file is in the bucket:
   ```bash
   docker exec jobboard-s3 awslocal s3 ls s3://cvs/cvs/      # LocalStack
   aws s3 ls "s3://$CV_BUCKET/cvs/"                           # real bucket
   ```
4. Attach a `.docx` instead. The form should say "CV must be a PDF file."

### 2.5 Open the admin dashboard locally

The admin dashboard is served on hosts whose first label is `admin` or `admin-*`. Locally, use **http://admin.localhost:3000**. Chrome and Firefox resolve `*.localhost` on their own.

Sessions are per host, so sign in again on `admin.localhost` even if you're signed in on `localhost`. Until your user is an admin (next step), the admin host answers `403`.

---

## 3. Make yourself an admin

Nobody can sign up as an admin. Sign up normally, then change your role in MongoDB:

```js
// mongosh "<MONGODB_URI>"   (or: docker exec -it jobboard-mongo mongosh jobboard)
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

Then **sign out and sign in again on the admin host**. The role is copied into the session at sign-in. For the same reason, demoting an admin only takes effect when they sign in again, or after 30 days when their session expires.

**Check:** http://admin.localhost:3000 shows the dashboard. Open an application with a CV and click the file name. The PDF downloads.

---

## 4. Deploy to staging and production

The pipeline applies Terraform before every deploy, so the bucket, its permissions and the `CV_BUCKET`/`AWS_REGION` parameters are created in the same run that ships the code. Do staging first.

### 4.1 One-time settings, per environment

Set these before the first deploy of this code. Replace `job-board-staging` with `job-board` for production.

```bash
export AWS_PROFILE=job-board-admin
APP=job-board-staging

aws ssm put-parameter --name /$APP/env/MONGODB_URI --type SecureString --value '<connection string>' --overwrite
aws ssm put-parameter --name /$APP/env/AUTH_SECRET --type SecureString --value "$(openssl rand -base64 32)" --overwrite
```

- **Atlas Network Access** must allow each environment's Elastic IP, and nothing else (plus your own IP for local development). Get it with `terraform output public_ip`, or read `public_ip` in `/<app>/deploy-config`. GitHub's runners never connect to the database, so never add `0.0.0.0/0`.
- **Never** set `CV_BUCKET` or `AWS_REGION` by hand. Terraform owns them and would overwrite yours.

### 4.2 Ship it

```bash
# staging
git push origin feat/s3-cv-uploads:staging      # or merge the branch into staging

# production, once staging checks out
# open a PR into main and merge it
```

In the **Deploy** run, the Terraform plan should show:

| Change | Resource |
| --- | --- |
| create | `aws_s3_bucket.cvs` and its public-access block, ownership, encryption and policy |
| create | `aws_ssm_parameter.cv_bucket`, `aws_ssm_parameter.aws_region` |
| update in place | `aws_iam_role_policy.instance` (adds `CvObjects`) |
| update in place | `aws_instance.app` (`http_put_response_hop_limit` 1 → 2) |

If the plan says the instance will be **replaced** instead, stop and check why before approving. The hop-limit change alone doesn't need a replacement.

---

## 5. Verify a deployment

```bash
APP=job-board-staging
BUCKET=$(aws ssm get-parameter --name /$APP/env/CV_BUCKET --query Parameter.Value --output text)
INSTANCE=$(aws ssm get-parameter --name /$APP/deploy-config --query Parameter.Value --output text | jq -r .instance_id)

# The bucket exists, blocks public access and has no files yet
aws s3api get-public-access-block --bucket "$BUCKET"
aws s3 ls "s3://$BUCKET/cvs/"

# The container can reach the instance role (hop limit 2)
aws ec2 describe-instances --instance-ids "$INSTANCE" \
  --query 'Reservations[0].Instances[0].MetadataOptions.HttpPutResponseHopLimit'   # 2
```

Then, on the site:
1. Sign up and apply to a job with a PDF. You should see "Application sent".
2. Check the file arrived: `aws s3 ls "s3://$BUCKET/cvs/"` shows one object named after the application id.
3. Make yourself an admin (step 3), sign in on the admin host, and download the CV.
4. Delete that application. The object disappears from `s3://$BUCKET/cvs/`.

App logs are in CloudWatch under `/<app>/app`.

---

## 6. Troubleshooting

| Symptom (in logs or the browser) | Cause | Fix |
| --- | --- | --- |
| `CV_BUCKET is not set` | Locally: missing from `.env`. Deployed: Terraform hasn't created the parameter, or the app was deployed before it existed. | Locally: add it. Deployed: let the pipeline apply Terraform, then redeploy (`gh workflow run deploy.yml --ref <branch>`). |
| `CredentialsProviderError: Could not load credentials from any providers` | Locally: no keys or profile. Deployed: the hop limit is still 1, so the container can't reach the instance role. | Locally: set `AWS_PROFILE`, or the LocalStack keys. Deployed: check the hop limit (step 5) and that Terraform applied. |
| `AccessDenied` from S3 | The identity can't use this bucket: wrong bucket name, or the role policy isn't applied yet. Locally: your profile lacks S3 permissions. | Compare `CV_BUCKET` with the `cv_bucket` Terraform output, and check the instance role has the `CvObjects` statement. |
| `PermanentRedirect` / `AuthorizationHeaderMalformed` | `AWS_REGION` doesn't match the bucket's region. | Use the region from the tfvars (`us-east-1`). |
| `NoSuchBucket` with LocalStack | The container restarted and lost the bucket. | `docker exec jobboard-s3 awslocal s3 mb s3://cvs` |
| `getaddrinfo ENOTFOUND cvs.s3.localhost.localstack.cloud` | No internet DNS, offline. | Add `127.0.0.1 cvs.s3.localhost.localstack.cloud` to `/etc/hosts`. |
| "CV must be a PDF file." for a real PDF | The file doesn't end in `.pdf`, or the browser reported a non-PDF type. | Rename it to `.pdf`. |
| Admin opens a CV and gets "Not found" | The application has CV details but no S3 object. Typical for CVs uploaded before the S3 switch, which stayed in MongoDB's old `cvs` collection. | Migrate the old files to `cvs/<applicationId>` in the bucket. |
| `MissingSecret` from `[auth]` | `AUTH_SECRET` isn't set. | Add it to `.env`, or to SSM and redeploy. |
| `MongooseServerSelectionError` | MongoDB isn't reachable, usually Atlas Network Access. | Allow your IP or the Elastic IP (see 4.1). |
| The admin host shows a blank `403` | You're signed in, but your role isn't `admin` in the session. | Step 3, then sign in again on the admin host. |

---

## 7. Removing the bucket

The bucket has no force-delete, because CVs are user data. `terraform destroy` stops at a non-empty bucket. To tear an environment down on purpose, empty the bucket first. Versioning is off, so this permanently deletes every CV.

```bash
aws s3 rm "s3://$BUCKET" --recursive
```

Then follow **Infrastructure lifecycle** in [DEPLOYMENT.md](DEPLOYMENT.md).

S3 costs for CVs are negligible at this scale: about $0.023 per GB per month, plus fractions of a cent per thousand uploads and downloads.
