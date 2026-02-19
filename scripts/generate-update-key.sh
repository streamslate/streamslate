#!/usr/bin/env bash
#
# Generate a Tauri updater signing keypair.
#
# This is a one-time setup step. The private key goes into CI/CD variables,
# and the public key goes into tauri.conf.json.
#
# Usage:
#   ./scripts/generate-update-key.sh
#
# After running:
#   1. Copy the PRIVATE key and set it as CI/CD variable TAURI_PRIVATE_KEY
#      (GitLab: Settings > CI/CD > Variables, masked + protected)
#   2. If you set a password, also set TAURI_KEY_PASSWORD
#   3. Copy the PUBLIC key and update tauri.conf.json -> tauri.updater.pubkey
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Generating Tauri updater signing keypair..."
echo ""
echo "You will be prompted for an optional password."
echo "If you set a password, you must also set TAURI_KEY_PASSWORD in CI."
echo ""

npx @tauri-apps/cli signer generate -w "$ROOT_DIR/.tauri-update-key"

echo ""
echo "============================================"
echo "  Key files generated:"
echo "============================================"
echo ""
echo "  Private key: .tauri-update-key"
echo "  Public key:  .tauri-update-key.pub"
echo ""
echo "Next steps:"
echo ""
echo "  1. Add the PRIVATE key as a CI/CD variable:"
echo "     - Variable: TAURI_PRIVATE_KEY"
echo "     - Value: $(cat "$ROOT_DIR/.tauri-update-key")"
echo "     - Flags: Masked, Protected"
echo ""
echo "  2. Update tauri.conf.json with the PUBLIC key:"
echo "     - Path: tauri.updater.pubkey"
echo "     - Value: $(cat "$ROOT_DIR/.tauri-update-key.pub")"
echo ""
echo "  3. Delete the local key files (they should only live in CI):"
echo "     rm .tauri-update-key .tauri-update-key.pub"
echo ""
echo "  WARNING: Do NOT commit the private key to version control."
echo ""
