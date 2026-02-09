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

## Implemented: API Key Authentication

API key authentication is now implemented in both GitHub Actions and GitLab CI workflows. This replaced the unreliable Apple ID/Password method.

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

### Step 3: Workflow Configuration (Already Done)

The GitHub Actions and GitLab CI workflows have been updated. Key changes:

- API key is decoded from `APPLE_API_KEY_BASE64` and written to a `.p8` file
- `APPLE_API_KEY_PATH` is passed to the Tauri build step (not the raw base64)
- The `if` condition on the setup step no longer references step-level env vars
- Build step has a 60-minute timeout to prevent indefinite hangs

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
