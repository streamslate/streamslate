# Fix macOS Notarization Hanging in GitHub Actions

## Problem Summary

The macOS build in GitHub Actions is hanging at the notarization step, even though signing is working correctly (shows "Developer ID Application: Cody Blevins").

## Immediate Fixes Applied

### 1. Fixed Signing Identity Configuration

Changed `src-tauri/tauri.conf.json` from:

```json
"signingIdentity": "-"  // Ad-hoc signing
```

To:

```json
"signingIdentity": null  // Use environment variable
```

### 2. Added Workflow Timeouts

- Job-level timeout: 90 minutes
- Step-level timeout: 60 minutes for the build step

### 3. Fixed APPLE_SIGNING_IDENTITY Environment Variable

Changed from a comment to actual environment variable reference:

```yaml
APPLE_SIGNING_IDENTITY: ${{ env.APPLE_SIGNING_IDENTITY }}
```

## Recommended: Switch to API Key Authentication

Using API keys instead of Apple ID/Password is more reliable for CI/CD. Here's how to set it up:

### Step 1: Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to Users and Access > Integrations
3. Click the + button
4. Select "Developer" access
5. Download the .p8 private key file (you can only download this once!)

### Step 2: Add GitHub Secrets

Add these secrets to your GitHub repository:

- `APPLE_API_ISSUER`: The Issuer ID (shown above the keys table)
- `APPLE_API_KEY`: The Key ID from the table
- `APPLE_API_KEY_BASE64`: Base64-encoded content of the .p8 file

To encode the .p8 file:

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 -o api_key_base64.txt
```

### Step 3: Update GitHub Workflow

Replace the Apple ID/Password authentication with API key authentication:

```yaml
- name: Setup Apple API Key for Notarization (macOS only)
  if: matrix.platform == 'macos-latest'
  run: |
    # Create directory for API key
    mkdir -p ~/private_keys

    # Decode and save the API key
    echo "$APPLE_API_KEY_BASE64" | base64 --decode > ~/private_keys/AuthKey_$APPLE_API_KEY.p8

    # Set the path environment variable
    echo "APPLE_API_KEY_PATH=$HOME/private_keys/AuthKey_$APPLE_API_KEY.p8" >> $GITHUB_ENV
  env:
    APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
    APPLE_API_KEY_BASE64: ${{ secrets.APPLE_API_KEY_BASE64 }}

- name: Build Tauri app
  uses: tauri-apps/tauri-action@v0.5.5
  timeout-minutes: 60
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
    APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
    APPLE_SIGNING_IDENTITY: ${{ env.APPLE_SIGNING_IDENTITY }}
    # API Key authentication (instead of APPLE_ID/APPLE_PASSWORD)
    APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
    APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
    APPLE_API_KEY_PATH: ${{ env.APPLE_API_KEY_PATH }}
  with:
    releaseId: ${{ needs.create-release.outputs.release_id }}
    includeUpdaterJson: false
```

## Temporary Workaround: Skip Notarization

If you need to test the build process without notarization, you can temporarily skip it by NOT providing any notarization credentials:

```yaml
# Comment out or remove these:
# APPLE_ID: ${{ secrets.APPLE_ID }}
# APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
# APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
# APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
# APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
```

The build will show: "Warn skipping app notarization, no authentication variables found"

Note: Apps without notarization will require users to manually approve them in System Preferences on first launch.

## Debugging Tips

1. **Check Apple Developer Status**: Ensure your Apple Developer account is active and has proper certificates
2. **Verify Secrets**: Double-check all GitHub secrets are properly set
3. **Monitor Notarization Status**: You can check notarization history at App Store Connect
4. **Use Verbose Logging**: Add `--verbose` to tauri-action args for more detailed output

## Common Issues

1. **"Invalid" status from notarization**: Usually means the app bundle has issues. Check for:
   - Unsigned binaries in the bundle
   - Missing entitlements
   - Incorrect bundle structure

2. **Timeout during notarization**: Apple's servers can be slow. The API key method is generally faster than password auth.

3. **Certificate issues**: Ensure your Developer ID Application certificate is valid and not expired.
