#!/usr/bin/env bash
# Runs in GitHub Actions (or locally with admin AWS credentials) to deploy to EC2
# without SSH: it sends deploy/remote-deploy.sh to the instance through SSM Run
# Command, waits for it, then verifies the public URL. If the public check fails
# after the switch, it asks the instance to roll back to the previous release.
#
#   ssm-deploy.sh deploy <image-uri> <version>
#   ssm-deploy.sh rollback
#
# Requires: aws CLI v2, jq, curl. Env: AWS_REGION, DEPLOY_CONFIG_PARAMETER.
set -Eeuo pipefail

: "${AWS_REGION:?}" "${DEPLOY_CONFIG_PARAMETER:?}"
MODE=${1:?usage: $0 deploy <image> <version> | rollback}
IMAGE=${2:-}
VERSION=${3:-}
HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
export AWS_REGION AWS_DEFAULT_REGION=$AWS_REGION

log() { echo "[$(date -u +%H:%M:%S)] $*"; }
fail() { echo "::error::$*"; exit 1; }

# Deployment settings are owned by Terraform and published to SSM Parameter Store.
CONFIG=$(aws ssm get-parameter --name "$DEPLOY_CONFIG_PARAMETER" --query Parameter.Value --output text)
cfg() { jq -r --arg k "$1" '.[$k] // ""' <<<"$CONFIG"; }
INSTANCE_ID=$(cfg instance_id)
APP_URL=$(cfg app_url)
PUBLIC_IP=$(cfg public_ip)
LOG_GROUP=$(cfg log_group)
[[ -n $INSTANCE_ID && -n $APP_URL ]] || fail "deploy config ${DEPLOY_CONFIG_PARAMETER} is incomplete"

wait_for_agent() {
  local i status
  for i in $(seq 1 60); do
    status=$(aws ssm describe-instance-information \
      --filters "Key=InstanceIds,Values=${INSTANCE_ID}" \
      --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || true)
    [[ $status == Online ]] && return 0
    log "Waiting for SSM agent on ${INSTANCE_ID} (status: ${status:-unknown}, attempt ${i}/60)"
    sleep 10
  done
  fail "SSM agent on ${INSTANCE_ID} is not online. Is the instance running?"
}

# Runs remote-deploy.sh on the instance with the given arguments.
run_remote() {
  local env_exports script_b64 params command_id status deadline
  env_exports=""
  for kv in "APP_NAME=$(cfg app_name)" "SITE_ADDRESS=$(cfg site_address)" \
    "ACME_EMAIL=$(cfg acme_email)" "LOG_GROUP=${LOG_GROUP}" \
    "ENV_PARAMETER_PATH=$(cfg env_parameter_path)" "AWS_REGION=${AWS_REGION}" \
    "CADDY_IMAGE=$(cfg caddy_image)"; do
    env_exports+="export ${kv%%=*}=$(printf '%q' "${kv#*=}"); "
  done
  local args
  args=$(printf '%q ' "$@")
  script_b64=$(base64 <"${HERE}/remote-deploy.sh" | tr -d '\n')
  params=$(jq -n --arg b64 "$script_b64" --arg run "${env_exports}bash /root/remote-deploy.sh ${args}" '{
    commands: [
      "set -e",
      ("echo " + $b64 + " | base64 -d > /root/remote-deploy.sh"),
      $run
    ],
    executionTimeout: ["900"]
  }')

  command_id=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name AWS-RunShellScript \
    --comment "${MODE} ${VERSION:-} (${GITHUB_RUN_ID:-local})" \
    --parameters "$params" \
    --cloud-watch-output-config "CloudWatchOutputEnabled=true,CloudWatchLogGroupName=${LOG_GROUP}" \
    --query Command.CommandId --output text) || return 1
  log "SSM command ${command_id}: remote-deploy.sh $*"

  deadline=$((SECONDS + 960))
  while ((SECONDS < deadline)); do
    status=$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$INSTANCE_ID" \
      --query Status --output text 2>/dev/null || echo Pending)
    case $status in
      Pending | InProgress | Delayed) sleep 5 ;;
      *) break ;;
    esac
  done

  echo "::group::Instance output (${command_id})"
  aws ssm get-command-invocation --command-id "$command_id" --instance-id "$INSTANCE_ID" \
    --query '[StandardOutputContent, StandardErrorContent]' --output text || true
  echo "::endgroup::"
  log "Remote command finished with status: ${status}"
  [[ $status == Success ]]
}

# Checks the public URL through DNS-independent --resolve, so a fresh DNS record
# (or the bare IP) can be verified immediately.
public_health_ok() {
  local expected=$1 host port body i
  host=$(sed -E 's#^https?://([^/:]+).*#\1#' <<<"$APP_URL")
  if [[ $APP_URL == https://* ]]; then port=443; else port=80; fi
  for i in $(seq 1 30); do
    if body=$(curl -fsS --max-time 5 --resolve "${host}:${port}:${PUBLIC_IP}" "${APP_URL}/api/health" 2>/dev/null); then
      if [[ -z $expected || $body == *"\"version\":\"${expected}\""* ]]; then
        log "Public health check passed: ${body}"
        return 0
      fi
      log "Public endpoint serves another version: ${body}"
    fi
    log "Public health check attempt ${i}/30 failed; retrying"
    sleep 5
  done
  return 1
}

summary() {
  if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then echo "$*" >>"$GITHUB_STEP_SUMMARY"; fi
}

wait_for_agent
case $MODE in
  deploy)
    [[ -n $IMAGE && -n $VERSION ]] || fail "deploy needs <image> <version>"
    run_remote deploy "$IMAGE" "$VERSION" ||
      fail "Deployment of ${VERSION} failed on the instance; the previous release is still live (see output above)"
    if ! public_health_ok "$VERSION"; then
      echo "::error::${APP_URL} did not serve ${VERSION} after the switch; rolling back"
      if run_remote rollback; then
        summary "### ❌ Deployment of \`${VERSION}\` failed public health check — rolled back"
      else
        summary "### ❌ Deployment of \`${VERSION}\` failed and rollback failed — investigate now"
      fi
      exit 1
    fi
    summary "### ✅ Deployed \`${VERSION}\` to ${APP_URL}"
    ;;
  rollback)
    run_remote rollback || fail "Rollback failed (see output above)"
    public_health_ok "" || fail "${APP_URL} is unhealthy after rollback"
    summary "### ↩️ Rolled back ${APP_URL} to the previous release"
    ;;
  *) fail "unknown mode ${MODE}" ;;
esac
