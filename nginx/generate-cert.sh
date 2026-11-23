#!/bin/bash
# Run once before first docker compose up
# Generates a self-signed SSL certificate for HTTPS

set -e
mkdir -p "$(dirname "$0")/certs"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$(dirname "$0")/certs/selfsigned.key" \
  -out "$(dirname "$0")/certs/selfsigned.crt" \
  -subj "/CN=localhost" 2>/dev/null

echo "✓ SSL certificate generated in nginx/certs/"
