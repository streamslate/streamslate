# macOS Code Signing Setup

This document explains how to set up Apple Developer code signing for StreamSlate to prevent the "app is damaged" error on macOS.

## Problem

Without proper code signing, macOS Gatekeeper blocks unsigned applications with the error:

```
"StreamSlate.app" is damaged and can't be opened. You should move it to the Trash.
```

## Solution

The repository is configured for Apple Developer code signing with API key notarization. Add the following secrets to your CI environment (GitHub and/or GitLab).

## Required Secrets

### Code Signing

| Secret                       | Description                       | How to generate                                                               |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| `APPLE_CERTIFICATE`          | Base64-encoded `.p12` certificate | `base64 -i certs/YourCert.p12 \| pbcopy`                                      |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12` file      | Set during certificate export                                                 |
| `APPLE_TEAM_ID`              | Apple Developer Team ID           | [developer.apple.com](https://developer.apple.com/account) Membership section |

### Notarization (API Key Method)

| Secret                 | Description                     | How to generate                                                                           |
| ---------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `APPLE_API_ISSUER`     | App Store Connect API Issuer ID | [App Store Connect](https://appstoreconnect.apple.com/) > Users and Access > Integrations |
| `APPLE_API_KEY`        | API Key ID                      | Shown in the keys table after creating a key                                              |
| `APPLE_API_KEY_BASE64` | Base64-encoded `.p8` key file   | `base64 -i AuthKey_XXXXXXXXXX.p8 \| pbcopy`                                               |

### Updater Signing (Optional)

| Secret               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `TAURI_PRIVATE_KEY`  | Tauri updater private key for auto-update signatures |
| `TAURI_KEY_PASSWORD` | Password for the updater key                         |

## Prerequisites

1. **Apple Developer Program membership** ($99/year)
2. **Developer ID Application certificate** from Apple Developer portal
3. **App Store Connect API key** for notarization

## How It Works

1. The CI workflow imports the `.p12` certificate into a temporary keychain
2. The signing identity is auto-detected from the imported certificate
3. Tauri signs the `.app` bundle using the detected identity
4. The API key is decoded from base64 and written to a `.p8` file
5. Tauri submits the signed app to Apple's notarization service using the API key
6. The temporary keychain and API key file are cleaned up after the build

## Testing

Once secrets are configured:

1. Create a new release tag or trigger the workflow manually
2. Download the generated `.dmg` file
3. The app should open without the "damaged" error
4. Verify signing: `codesign -dv --verbose=4 /path/to/StreamSlate.app`

## Alternative: Temporary Workaround

If you don't have Apple Developer certificates yet, users can bypass the error by:

1. Right-click the app > "Open"
2. Click "Open" in the security dialog
3. Or run: `xattr -cr /path/to/StreamSlate.app` to remove quarantine attributes

**Note:** This workaround is not recommended for distribution as it requires users to manually override security settings.
