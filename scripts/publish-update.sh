#!/usr/bin/env bash
#
# Publish Tauri auto-update artifacts to a GitHub Release.
#
# Generates latest.json and uploads signed update bundles alongside it.
#
# Usage:
#   ./scripts/publish-update.sh [--tag vX.Y.Z] [--dry-run]
#
# Environment:
#   GH_TOKEN - GitHub token with repo scope (used by gh CLI)
#
# Prerequisites:
#   - gh CLI authenticated
#   - Build completed with TAURI_SIGNING_PRIVATE_KEY set (produces .tar.gz + .sig)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPO="streamslate/streamslate"
BUNDLE_DIR="src-tauri/target/release/bundle/macos"

tag=""
dry_run=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)   tag="$2"; shift 2 ;;
    --dry-run) dry_run=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# Determine version from package.json if no tag provided
if [[ -z "$tag" ]]; then
  version="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)")"
  tag="v${version}"
fi

version="${tag#v}"
echo "Publishing update artifacts for ${tag} (version ${version})"

# Locate the signed update bundle
# Tauri v1 produces: AppName.app.tar.gz and AppName.app.tar.gz.sig
tarball=""
sig_file=""

for f in "${BUNDLE_DIR}"/*.app.tar.gz; do
  if [[ -f "$f" ]]; then
    tarball="$f"
    break
  fi
done

if [[ -z "$tarball" || ! -f "$tarball" ]]; then
  echo "Error: No .app.tar.gz update bundle found in ${BUNDLE_DIR}" >&2
  echo "Was the build run with TAURI_SIGNING_PRIVATE_KEY set?" >&2
  exit 1
fi

sig_file="${tarball}.sig"
if [[ ! -f "$sig_file" ]]; then
  echo "Error: Signature file not found: ${sig_file}" >&2
  exit 1
fi

tarball_name="$(basename "$tarball")"
signature="$(cat "$sig_file")"

echo "Update bundle: ${tarball_name}"
echo "Signature: ${signature:0:40}..."

# Build the download URL for this release
base_url="https://github.com/${REPO}/releases/download/${tag}"
tarball_url="${base_url}/${tarball_name}"

# Detect current architecture
arch="$(uname -m)"
case "$arch" in
  arm64|aarch64) rust_arch="aarch64" ;;
  x86_64)        rust_arch="x86_64" ;;
  *)             echo "Warning: Unknown architecture ${arch}, defaulting to aarch64"; rust_arch="aarch64" ;;
esac

platform_key="darwin-${rust_arch}"

# Get release notes from the GitHub release (if it exists) or changelog
notes=""
if gh release view "$tag" --repo "$REPO" --json body --jq '.body' >/dev/null 2>&1; then
  notes="$(gh release view "$tag" --repo "$REPO" --json body --jq '.body')"
fi

if [[ -z "$notes" ]]; then
  notes="StreamSlate ${version}"
fi

pub_date="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Generate latest.json
# Note: Only includes the platform we built for. Multi-platform releases
# should merge platform entries from each CI runner.
latest_json="$(cat <<ENDJSON
{
  "version": "${version}",
  "notes": $(node -e "process.stdout.write(JSON.stringify(process.argv[1]))" -- "$notes"),
  "pub_date": "${pub_date}",
  "platforms": {
    "${platform_key}": {
      "signature": "${signature}",
      "url": "${tarball_url}"
    }
  }
}
ENDJSON
)"

echo ""
echo "Generated latest.json:"
echo "$latest_json" | node -e "process.stdout.write(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')),null,2)+'\n')"

if [[ "$dry_run" == "true" ]]; then
  echo ""
  echo "[dry-run] Would upload to GitHub release ${tag}:"
  echo "  - ${tarball_name}"
  echo "  - latest.json"
  exit 0
fi

# Ensure the GitHub release exists
if ! gh release view "$tag" --repo "$REPO" >/dev/null 2>&1; then
  echo "Creating GitHub release ${tag}..."
  gh release create "$tag" --repo "$REPO" --title "StreamSlate ${version}" --notes "$notes"
fi

# Write latest.json to a temp file for upload
latest_tmp="$(mktemp)"
echo "$latest_json" | node -e "process.stdout.write(JSON.stringify(JSON.parse(require('fs').readFileSync(0,'utf8')),null,2)+'\n')" > "$latest_tmp"

# Upload artifacts (--clobber overwrites existing assets with the same name)
echo "Uploading ${tarball_name}..."
gh release upload "$tag" "$tarball" --repo "$REPO" --clobber

echo "Uploading latest.json..."
gh release upload "$tag" "${latest_tmp}#latest.json" --repo "$REPO" --clobber

rm -f "$latest_tmp"

echo ""
echo "Update artifacts published to: https://github.com/${REPO}/releases/tag/${tag}"
echo "Update endpoint: ${base_url}/latest.json"
