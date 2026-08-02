#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# wait-for-it.sh — Wait for a service to become available before proceeding
# ---------------------------------------------------------------------------
# Usage: ./scripts/wait-for-it.sh host:port [-t timeout] [-- command]
#
# Examples:
#   ./scripts/wait-for-it.sh localhost:5432 -t 30
#   ./scripts/wait-for-it.sh localhost:5432 -- pnpm run dev
#
# Exit codes:
#   0 — Service is available (or command succeeded)
#   1 — Timeout reached
#   2 — Invalid usage
# ---------------------------------------------------------------------------

set -e

host="$1"
shift

usage() {
  cat <<EOF
Usage: $(basename "$0") host:port [-t timeout] [-- command]

  -t timeout  Maximum seconds to wait (default: 30)
  -- command  Command to run after the service is available
EOF
  exit 2
}

timeout=30
command=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t)
      timeout="$2"
      shift 2
      ;;
    --)
      shift
      command="$@"
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      ;;
    *)
      command="$@"
      break
      ;;
  esac
done

if [[ -z "$host" ]]; then
  echo "Error: host:port is required" >&2
  usage
fi

# Parse host and port
if [[ "$host" == *:* ]]; then
  IFS=':' read -r addr port <<< "$host"
else
  addr="$host"
  port=""
fi

elapsed=0
interval=1

while [[ $elapsed -lt $timeout ]]; do
  if (echo > "/dev/tcp/$addr/$port") 2>/dev/null; then
    echo "✓ $addr:$port is available after ${elapsed}s"
    if [[ -n "$command" ]]; then
      exec $command
    fi
    exit 0
  fi

  sleep $interval
  elapsed=$((elapsed + interval))
done

echo "✗ Timed out waiting for $addr:$port after ${timeout}s" >&2
exit 1
