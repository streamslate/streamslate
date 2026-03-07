#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_ENV="$ROOT_DIR/build.env"
APP_BUNDLE_DEFAULT="$ROOT_DIR/src-tauri/target/release/bundle/macos/StreamSlate.app"
APP_BUNDLE="${APP_BUNDLE_PATH:-$APP_BUNDLE_DEFAULT}"
APP_BUNDLE_DIR="$(dirname "$APP_BUNDLE")"
DMG_DIR="$ROOT_DIR/src-tauri/target/release/bundle/dmg"

if [[ -f "$BUILD_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$BUILD_ENV"
  set +a
fi

if [[ ! -d "$APP_BUNDLE" ]]; then
  echo "Error: Expected app bundle at $APP_BUNDLE"
  exit 1
fi

VERSION="$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")"

case "$(uname -m)" in
  arm64)
    ARCH_SUFFIX="aarch64"
    ;;
  x86_64)
    ARCH_SUFFIX="x64"
    ;;
  *)
    ARCH_SUFFIX="$(uname -m)"
    ;;
esac

DMG_PATH="$DMG_DIR/StreamSlate_${VERSION}_${ARCH_SUFFIX}.dmg"

mkdir -p "$DMG_DIR"
rm -f "$DMG_PATH"

echo "Creating APFS DMG at $DMG_PATH"
hdiutil create \
  -srcfolder "$APP_BUNDLE_DIR" \
  -volname "StreamSlate" \
  -fs APFS \
  -format UDZO \
  "$DMG_PATH"

if [[ -n "${APPLE_SIGNING_IDENTITY:-}" ]]; then
  echo "Codesigning DMG with identity: $APPLE_SIGNING_IDENTITY"
  codesign --force --sign "$APPLE_SIGNING_IDENTITY" "$DMG_PATH"
  codesign --verify --verbose=2 "$DMG_PATH"
else
  echo "APPLE_SIGNING_IDENTITY not set; leaving DMG unsigned"
fi

if [[ -n "${APPLE_API_KEY_PATH:-}" && -n "${APPLE_API_KEY:-}" && -n "${APPLE_API_ISSUER:-}" ]]; then
  echo "Submitting DMG for notarization"
  xcrun notarytool submit \
    "$DMG_PATH" \
    --key "$APPLE_API_KEY_PATH" \
    --key-id "$APPLE_API_KEY" \
    --issuer "$APPLE_API_ISSUER" \
    --wait
  echo "Stapling notarization ticket to DMG"
  xcrun stapler staple "$DMG_PATH"
else
  echo "Apple notarization credentials not set; skipping DMG notarization"
fi

echo "Created DMG: $DMG_PATH"
