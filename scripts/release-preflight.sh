#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_ITCHIO="caedus90/streamslate"
ENV_FILE="${ROOT_DIR}/ai.env"
strict=false

if [[ "${1:-}" == "--strict" ]]; then
  strict=true
fi

failures=0

log() {
  printf '%s\n' "$1"
}

ok() {
  printf '✅ %s\n' "$1"
}

warn() {
  printf '⚠️  %s\n' "$1"
}

err() {
  printf '❌ %s\n' "$1"
  failures=$((failures + 1))
}

critical_warn() {
  local msg="$1"
  if [[ "$strict" == "true" ]]; then
    err "$msg"
  else
    warn "$msg"
  fi
}

check_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "Found command: ${cmd}"
  else
    err "Missing command: ${cmd}"
  fi
}

log "== StreamSlate Release Preflight =="
log "Repo: ${ROOT_DIR}"
log "Mode: $([[ "$strict" == "true" ]] && echo "strict" || echo "standard")"
log ""

for c in git node npm cargo gh butler; do
  check_cmd "$c"
done

log ""
if [[ -f "$ENV_FILE" && -z "${BUTLER_API_KEY:-}" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
  ok "Loaded environment from ai.env"
fi

if [[ -n "${BUTLER_API_KEY:-}" ]]; then
  ok "BUTLER_API_KEY is set"
else
  err "BUTLER_API_KEY is not set (itch.io checks will fail)"
fi

log ""
if git diff --quiet && git diff --cached --quiet; then
  ok "Git working tree is clean"
else
  warn "Git working tree has local changes"
fi

status_line="$(git status --short --branch | head -n1 || true)"
log "Git: ${status_line}"

version_json="$(node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargoMatch = cargo.match(/^version\s*=\s*"([^"]+)"/m);
const cargoVersion = cargoMatch ? cargoMatch[1] : '';
const tauriVersion = tauri?.package?.version || tauri?.version || '';
process.stdout.write(JSON.stringify({ pkg: pkg.version, cargo: cargoVersion, tauri: tauriVersion }));
NODE
)"

pkg_version="$(echo "$version_json" | node -e 'const v = JSON.parse(require("fs").readFileSync(0, "utf8")); process.stdout.write(v.pkg || "")')"
cargo_version="$(echo "$version_json" | node -e 'const v = JSON.parse(require("fs").readFileSync(0, "utf8")); process.stdout.write(v.cargo || "")')"
tauri_version="$(echo "$version_json" | node -e 'const v = JSON.parse(require("fs").readFileSync(0, "utf8")); process.stdout.write(v.tauri || "")')"

if [[ "$pkg_version" == "$cargo_version" && "$pkg_version" == "$tauri_version" ]]; then
  ok "Version alignment: ${pkg_version} (package/cargo/tauri)"
else
  err "Version mismatch: package=${pkg_version}, cargo=${cargo_version}, tauri=${tauri_version}"
fi

expected_tag="v${pkg_version}"
if git rev-parse -q --verify "refs/tags/${expected_tag}" >/dev/null; then
  ok "Tag exists: ${expected_tag}"
else
  critical_warn "Tag not found locally: ${expected_tag}"
fi

if git rev-parse -q --verify "refs/tags/${expected_tag}" >/dev/null; then
  tag_pkg_version="$(git show "${expected_tag}:package.json" 2>/dev/null | node -e 'const fs=require("fs"); try{const j=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(j.version||"");}catch{process.stdout.write("")}')"
  tag_cargo_version="$(git show "${expected_tag}:src-tauri/Cargo.toml" 2>/dev/null | node -e 'const fs=require("fs"); const s=fs.readFileSync(0,"utf8"); const m=s.match(/^version\s*=\s*"([^"]+)"/m); process.stdout.write(m?m[1]:"");')"
  tag_tauri_version="$(git show "${expected_tag}:src-tauri/tauri.conf.json" 2>/dev/null | node -e 'const fs=require("fs"); try{const j=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write((j?.package?.version||j?.version||""));}catch{process.stdout.write("")}')"

  if [[ "$tag_pkg_version" == "$pkg_version" && "$tag_cargo_version" == "$pkg_version" && "$tag_tauri_version" == "$pkg_version" ]]; then
    ok "Tag content versions match local release version (${pkg_version})"
  else
    critical_warn "Tag content mismatch: tag package=${tag_pkg_version:-?}, cargo=${tag_cargo_version:-?}, tauri=${tag_tauri_version:-?} vs local=${pkg_version}"
  fi
fi

log ""
if gh release view "$expected_tag" --repo streamslate/streamslate >/dev/null 2>&1; then
  ok "GitHub release exists: ${expected_tag}"
else
  critical_warn "GitHub release not visible (or gh auth/repo access missing) for ${expected_tag}"
fi

asset_names="$(gh release view "$expected_tag" --repo streamslate/streamslate --json assets 2>/dev/null | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8")); for (const a of (j.assets||[])) console.log(a.name);' || true)"
dmg_count="$(printf '%s\n' "$asset_names" | rg -c '\.dmg$' || true)"
appimage_count="$(printf '%s\n' "$asset_names" | rg -c '\.AppImage$' || true)"
exe_count="$(printf '%s\n' "$asset_names" | rg -c '\.exe$' || true)"

if [[ "${dmg_count:-0}" -gt 0 && "${appimage_count:-0}" -gt 0 && "${exe_count:-0}" -gt 0 ]]; then
  ok "GitHub release has desktop binaries (.dmg/.AppImage/.exe)"
else
  critical_warn "GitHub release assets incomplete: dmg=${dmg_count:-0}, AppImage=${appimage_count:-0}, exe=${exe_count:-0}"
fi

if [[ -n "${BUTLER_API_KEY:-}" ]]; then
  butler_output="$(butler status "$PROJECT_ITCHIO" 2>&1 || true)"
  if echo "$butler_output" | rg -q "No channel"; then
    critical_warn "itch.io project has no channels yet (${PROJECT_ITCHIO})"
  elif [[ -n "$butler_output" ]]; then
    ok "itch.io status returned for ${PROJECT_ITCHIO}"
    echo "$butler_output" | sed -n '1,40p'
  else
    warn "itch.io status returned empty output"
  fi
else
  warn "Skipping itch.io status because BUTLER_API_KEY is not set"
fi

log ""
if [[ "$failures" -gt 0 ]]; then
  err "Preflight completed with ${failures} blocking error(s)"
  exit 1
fi

ok "Preflight completed with no blocking errors"
