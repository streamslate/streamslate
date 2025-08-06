# Plan to Fix Build Issues

## Issue 1: macOS Signing Failure

### Root Cause

The macOS signing is failing because:

1. The certificate is imported into a custom keychain but Tauri can't find the signing identity
2. The `APPLE_SIGNING_IDENTITY` environment variable needs proper extraction and verification

### Solution

Update the release workflow to:

1. Extract the signing identity from the imported certificate
2. Pass it to Tauri via the correct mechanism
3. Add debugging to verify the identity is correctly detected

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
- `APPLE_SIGNING_IDENTITY` - Can be auto-detected now
- `APPLE_ID` - Apple Developer account email
- `APPLE_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Team ID from Apple Developer account
