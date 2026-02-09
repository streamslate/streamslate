# Plan to Fix Build Issues

## Issue 1: macOS Signing Failure - RESOLVED

### Root Causes (Fixed)

1. GitHub Actions `if` condition referenced step-level env var (always skipped API key setup)
2. `APPLE_API_KEY_BASE64` passed directly instead of `APPLE_API_KEY_PATH` (Tauri v1 needs a file path)
3. GitLab CI `source build.env` didn't export vars to child processes
4. Stale keychains accumulated from failed CI runs

### Resolution

- Fixed `if` condition to check inside shell script instead of GitHub Actions expression
- Decode API key to `.p8` file and pass `APPLE_API_KEY_PATH` to Tauri
- Use `set -a && source build.env && set +a` in GitLab CI
- Save/restore original keychain search list in import-certificate.sh

### Changes Needed in `.github/workflows/release.yml`:

```yaml
- name: Import Apple Certificate and Setup Keychain (macOS only)
  if: matrix.platform == 'macos-latest'
  run: |
    # Create keychain
    security create-keychain -p actions build.keychain
    security default-keychain -s build.keychain
    security unlock-keychain -p actions build.keychain
    security set-keychain-settings -t 3600 -u build.keychain

    # Import certificate
    echo "$APPLE_CERTIFICATE" | base64 --decode > certificate.p12
    security import certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security

    # Import Apple Intermediate Certificate
    wget -O AppleWWDRCAG3.cer "https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer"
    security import AppleWWDRCAG3.cer -k build.keychain -T /usr/bin/codesign

    # Set partition list
    security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k actions build.keychain

    # Extract signing identity
    SIGNING_IDENTITY=$(security find-identity -v -p codesigning build.keychain | grep "Developer ID Application" | awk -F'"' '{print $2}' | head -1)
    echo "APPLE_SIGNING_IDENTITY=$SIGNING_IDENTITY" >> $GITHUB_ENV

    # Verify
    echo "Detected signing identity: $SIGNING_IDENTITY"
```

Also need to update the Tauri configuration to include signing settings:

```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "hardenedRuntime": true,
        "entitlements": null,
        "signingIdentity": "-"
      }
    }
  }
}
```

## Issue 2: Docker Build Rollup Module Error

### Root Cause

npm has issues with optional dependencies, especially platform-specific ones. The rollup package has many optional native modules, and Docker builds are failing to install the correct one.

### Solution

Update the Dockerfile to handle npm dependencies better:

### Changes Needed in `Dockerfile`:

```dockerfile
# Frontend builder stage
FROM node:18-slim AS frontend-builder

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with better handling
RUN npm cache clean --force && \
    npm install --ignore-scripts --no-optional && \
    npm rebuild && \
    npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build
```

Alternative approach if the above doesn't work:

```dockerfile
# Use .npmrc to force install optional dependencies
RUN echo "optional=false" > .npmrc && \
    npm ci --force || npm install
```

## Testing Strategy

1. For macOS signing:
   - Push changes to a test branch
   - Create a test tag to trigger the release workflow
   - Monitor the signing process in GitHub Actions

2. For Docker build:
   - Test locally first: `docker build -t test .`
   - Push changes and let CI build multi-platform images

## Required GitHub Secrets

Ensure these are set:

- `APPLE_CERTIFICATE` - Base64 encoded .p12 certificate
- `APPLE_CERTIFICATE_PASSWORD` - Password for the certificate
- `APPLE_TEAM_ID` - Team ID from Apple Developer account
- `APPLE_API_ISSUER` - App Store Connect API Issuer ID
- `APPLE_API_KEY` - App Store Connect API Key ID
- `APPLE_API_KEY_BASE64` - Base64-encoded .p8 API key file

Note: `APPLE_SIGNING_IDENTITY` is auto-detected from the imported certificate. `APPLE_ID`/`APPLE_PASSWORD` are no longer needed (replaced by API key auth).
