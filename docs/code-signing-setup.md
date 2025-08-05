# macOS Code Signing Setup

This document explains how to set up Apple Developer code signing for StreamSlate to prevent the "app is damaged" error on macOS.

## Problem

Without proper code signing, macOS Gatekeeper blocks unsigned applications with the error:

```
"StreamSlate.app" is damaged and can't be opened. You should move it to the Trash.
```

## Solution

The repository is now configured for Apple Developer code signing. You need to add the following secrets to your GitHub repository.

## Required GitHub Secrets

Navigate to your repository Settings → Secrets and Variables → Actions, and add these secrets:

### 1. `APPLE_CERTIFICATE`

- Your Apple Developer certificate in base64 format
- Export your Developer ID Application certificate from Keychain Access as a .p12 file
- Convert to base64: `base64 -i certificate.p12 | pbcopy`

### 2. `APPLE_CERTIFICATE_PASSWORD`

- The password for your .p12 certificate file

### 3. `APPLE_SIGNING_IDENTITY`

- Your certificate's signing identity (usually starts with "Developer ID Application:")
- Find this in Keychain Access or use: `security find-identity -v -p codesigning`

### 4. `APPLE_ID`

- Your Apple ID email address used for the Developer Program

### 5. `APPLE_PASSWORD`

- An app-specific password for your Apple ID
- Generate at: https://appleid.apple.com/account/manage (Sign-In and Security → App-Specific Passwords)

### 6. `APPLE_TEAM_ID`

- Your Apple Developer Team ID
- Find at: https://developer.apple.com/account (Membership section)

## Prerequisites

1. **Apple Developer Program membership** ($99/year)
2. **Developer ID Application certificate** from Apple Developer portal
3. **App-specific password** for notarization

## Testing

Once secrets are configured:

1. Create a new release or re-run the existing workflow
2. Download the generated .dmg file
3. The app should now open without the "damaged" error

## Alternative: Temporary Workaround

If you don't have Apple Developer certificates yet, users can bypass the error by:

1. Right-click the app → "Open"
2. Click "Open" in the security dialog
3. Or run: `xattr -cr /path/to/StreamSlate.app` to remove quarantine attributes

**Note:** This workaround is not recommended for distribution as it requires users to manually override security settings.
