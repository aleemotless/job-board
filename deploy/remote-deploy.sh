#!/usr/bin/env bash
# Runs ON the EC2 instance (as root, via SSM Run Command) to switch releases.
#
#   remote-deploy.sh deploy <image-uri> <version>
#   remote-deploy.sh rollback
#
# Blue/green on a single host: the new release starts in the idle slot next to
# the live one, must pass its health check, and only then does Caddy switch
# traffic to it (graceful reload). The previous release is stopped but kept, so
# `rollback` can restart it. If anything fails before the switch, the live
# release is untouched.
#
# Configuration comes from the environment (set by deploy/ssm-deploy.sh):
#   APP_NAME, SITE_ADDRESS, ACME_EMAIL, LOG_GROUP, ENV_PARAMETER_PATH,
#   AWS_REGION, CADDY_IMAGE
set -Eeuo pipefail

: "${APP_NAME:?}" "${SITE_ADDRESS:?}" "${LOG_GROUP:?}" "${ENV_PARAMETER_PATH:?}" "${AWS_REGION:?}"
ACME_EMAIL="${ACME_EMAIL:-}"
CADDY_IMAGE="${CADDY_IMAGE:-caddy:2.11-alpine}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
DRAIN_SECONDS="${DRAIN_SECONDS:-5}"
LOG_DRIVER="${LOG_DRIVER:-awslogs}" # override only for local testing

STATE_DIR="/var/lib/${APP_NAME}"
CONF_DIR="/etc/${APP_NAME}"
CADDY_DIR="${CONF_DIR}/caddy"
ENV_FILE="${CONF_DIR}/app.env"
NETWORK="${APP_NAME}-net"
PROXY="${APP_NAME}-proxy"
CONTAINER_PORT=3000

# Sets LOG_ARGS (docker run logging flags) for the given log stream.
set_log_args() {
  if [[ $LOG_DRIVER == awslogs ]]; then
    LOG_ARGS=(--log-driver awslogs --log-opt "awslogs-region=${AWS_REGION}"
      --log-opt "awslogs-group=${LOG_GROUP}" --log-opt "awslogs-stream=$1")
  else
    LOG_ARGS=(--log-driver "$LOG_DRIVER")
  fi
}

log() { echo "[$(date -u +%H:%M:%S)] $*"; }
die() { log "ERROR: $*"; exit 1; }

container() { echo "${APP_NAME}-$1"; }
host_port() { if [[ $1 == blue ]]; then echo 3001; else echo 3002; fi; }
other_slot() { if [[ $1 == blue ]]; then echo green; else echo blue; fi; }
active_slot() { cat "${STATE_DIR}/active-slot" 2>/dev/null || true; }
exists() { docker container inspect "$1" >/dev/null 2>&1; }

wait_for_bootstrap() {
  # On a brand-new instance the first deploy can arrive before user data has
  # finished installing Docker.
  if command -v cloud-init >/dev/null; then
    cloud-init status --wait >/dev/null || die "cloud-init failed; see /var/log/cloud-init-output.log"
  fi
  docker info >/dev/null 2>&1 || die "docker is not running"
}

# Waits until the slot's container answers /api/health (optionally with the
# expected version). Prints the container's logs on failure.
wait_healthy() {
  local slot=$1 expected=${2:-} name port body deadline
  name=$(container "$slot"); port=$(host_port "$slot")
  deadline=$((SECONDS + HEALTH_TIMEOUT))
  log "Waiting up to ${HEALTH_TIMEOUT}s for ${name} on 127.0.0.1:${port}"
  while ((SECONDS < deadline)); do
    if [[ $(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null) != true ]]; then
      log "${name} is not running"; break
    fi
    if body=$(curl -fsS --max-time 3 "http://127.0.0.1:${port}/api/health" 2>/dev/null); then
      if [[ -z $expected || $body == *"\"version\":\"${expected}\""* ]]; then
        log "${name} healthy: ${body}"; return 0
      fi
      log "Unexpected health response: ${body}"
    fi
    sleep 2
  done
  log "${name} failed its health check. Last log lines:"
  docker logs --tail 80 "$name" 2>&1 || true
  return 1
}

write_env_file() {
  # Every parameter under ENV_PARAMETER_PATH becomes an env var named after the
  # last path segment, e.g. /job-board/env/DATABASE_URL -> DATABASE_URL.
  local tmp
  tmp=$(mktemp "${CONF_DIR}/.app.env.XXXXXX")
  chmod 600 "$tmp"
  aws ssm get-parameters-by-path --region "$AWS_REGION" --path "$ENV_PARAMETER_PATH" \
    --recursive --with-decryption --query 'Parameters[].[Name,Value]' --output text |
    while IFS=$'\t' read -r name value; do
      [[ -n $name ]] && printf '%s=%s\n' "${name##*/}" "$value"
    done >"$tmp"
  mv "$tmp" "$ENV_FILE"
  log "Loaded $(wc -l <"$ENV_FILE") app environment variable(s) from ${ENV_PARAMETER_PATH}"
}

start_slot() {
  local slot=$1 image=$2 version=$3 name
  name=$(container "$slot")
  docker rm -f "$name" >/dev/null 2>&1 || true
  set_log_args "app/${version}/${slot}"
  log "Starting ${name} from ${image}"
  docker run -d --name "$name" \
    --network "$NETWORK" \
    --publish "127.0.0.1:$(host_port "$slot"):${CONTAINER_PORT}" \
    --env-file "$ENV_FILE" \
    --restart unless-stopped \
    --init \
    --stop-timeout 30 \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --label "${APP_NAME}.version=${version}" \
    "${LOG_ARGS[@]}" \
    "$image" >/dev/null
}

write_caddyfile() {
  local upstream=$1 tmp
  tmp=$(mktemp "${CADDY_DIR}/.Caddyfile.XXXXXX")
  {
    if [[ -n $ACME_EMAIL ]]; then printf '{\n\temail %s\n}\n\n' "$ACME_EMAIL"; fi
    cat <<EOF
${SITE_ADDRESS} {
	encode zstd gzip
	reverse_proxy ${upstream}:${CONTAINER_PORT} {
		# Pass streamed (Suspense/PPR) responses through without buffering.
		flush_interval -1
	}
}
EOF
  } >"$tmp"
  chmod 644 "$tmp"
  mv "$tmp" "${CADDY_DIR}/Caddyfile"
}

# Points the proxy at the given slot, creating the proxy container if needed.
# Returns non-zero on failure (errexit is off when called from a condition).
switch_proxy() {
  local slot=$1
  write_caddyfile "$(container "$slot")" || return 1
  if exists "$PROXY" && [[ $(docker inspect -f '{{.Config.Image}}' "$PROXY") == "$CADDY_IMAGE" ]]; then
    docker start "$PROXY" >/dev/null || return 1
    log "Reloading proxy -> $(container "$slot")"
    docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || return 1
  else
    docker rm -f "$PROXY" >/dev/null 2>&1 || true
    set_log_args proxy
    log "Starting proxy ${CADDY_IMAGE} -> $(container "$slot")"
    docker run -d --name "$PROXY" \
      --network "$NETWORK" \
      --publish 80:80 --publish 443:443 --publish 443:443/udp \
      --volume "${CADDY_DIR}:/etc/caddy:ro" \
      --volume "${APP_NAME}-caddy-data:/data" \
      --volume "${APP_NAME}-caddy-config:/config" \
      --restart unless-stopped \
      "${LOG_ARGS[@]}" \
      "$CADDY_IMAGE" >/dev/null || return 1
  fi
  echo "$slot" >"${STATE_DIR}/active-slot"
}

retire_slot() {
  local name
  name=$(container "$1")
  exists "$name" || return 0
  sleep "$DRAIN_SECONDS" # let in-flight requests on the old upstream finish
  log "Stopping ${name} (kept for rollback)"
  docker stop "$name" >/dev/null || true
}

deploy() {
  local image=${1:?image uri required} version=${2:?version required}
  local current next
  current=$(active_slot)
  next=$(other_slot "${current:-green}")

  if [[ $image == *.dkr.ecr.*.amazonaws.com/* ]]; then
    log "Logging in to ${image%%/*}"
    aws ecr get-login-password --region "$AWS_REGION" |
      docker login --username AWS --password-stdin "${image%%/*}" >/dev/null
  fi
  log "Pulling ${image}"
  docker pull --quiet "$image" >/dev/null

  write_env_file
  start_slot "$next" "$image" "$version"
  if ! wait_healthy "$next" "$version"; then
    docker rm -f "$(container "$next")" >/dev/null 2>&1 || true
    die "new release ${version} is unhealthy; live release (${current:-none}) left untouched"
  fi

  if ! switch_proxy "$next"; then
    if [[ -n $current ]]; then
      write_caddyfile "$(container "$current")"
      docker exec "$PROXY" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
    fi
    docker rm -f "$(container "$next")" >/dev/null 2>&1 || true
    die "proxy switch failed; ${current:-no} release still serving"
  fi
  [[ -n $current ]] && retire_slot "$current"

  # Removes images no container references; the stopped previous release keeps its image.
  docker image prune -af >/dev/null || true
  log "Deployed ${version} in slot ${next}"
}

rollback() {
  local current previous
  current=$(active_slot)
  [[ -n $current ]] || die "nothing deployed yet"
  previous=$(other_slot "$current")
  exists "$(container "$previous")" || die "no previous release to roll back to"

  log "Rolling back from $(container "$current") to $(container "$previous")"
  docker start "$(container "$previous")" >/dev/null
  wait_healthy "$previous" || die "previous release is unhealthy too; leaving ${current} live"
  switch_proxy "$previous" || die "proxy switch failed; ${current} still serving"
  retire_slot "$current"
  log "Rolled back to $(docker inspect -f "{{index .Config.Labels \"${APP_NAME}.version\"}}" "$(container "$previous")")"
}

main() {
  local cmd=${1:-}
  shift || true
  wait_for_bootstrap
  mkdir -p "$STATE_DIR" "$CADDY_DIR"
  chmod 700 "$CONF_DIR"
  docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null

  exec 9>"/run/${APP_NAME}-deploy.lock"
  flock -w 600 9 || die "another deployment is still running"

  case $cmd in
    deploy) deploy "$@" ;;
    rollback) rollback ;;
    *) die "usage: $0 deploy <image> <version> | rollback" ;;
  esac
}

main "$@"
