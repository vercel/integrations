#!/usr/bin/env bash

set -euo pipefail

if [ -z "${HOST:-}" ]; then
  echo "missing environment variable: HOST" >&2
  exit 1
fi

if [ -z "${API_SECRET:-}" ]; then
  echo "missing environment variable: API_SECRET" >&2
  exit 1
fi

curl -H "Authorization: Bearer $API_SECRET" -v -X POST "${HOST}/update"
