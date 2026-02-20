#!/bin/bash
set -e

echo "Setting up Code Signing..."

# Check for required variables
if [ -z "$APPLE_CERTIFICATE" ] || [ -z "$APPLE_CERTIFICATE_PASSWORD" ]; then
    echo "Error: APPLE_CERTIFICATE or APPLE_CERTIFICATE_PASSWORD not set."
    echo "Please add these as File/Variable type CI/CD variables in GitLab."
    exit 1
fi

# Create keychain with password
KEYCHAIN_PASSWORD="gitlab-runner"
KEYCHAIN_PATH="$PWD/app-signing.keychain-db"

# Save original keychain search list for cleanup
ORIGINAL_KEYCHAINS=$(security list-keychains -d user | sed 's/"//g' | tr '\n' ' ')

echo "Creating temporary keychain at $KEYCHAIN_PATH..."

# Remove stale keychain from a previous failed run (if it exists)
if [ -f "$KEYCHAIN_PATH" ]; then
    echo "Removing stale keychain from previous run..."
    security delete-keychain "$KEYCHAIN_PATH" 2>/dev/null || true
fi

# Create new keychain
security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
# Disable auto-lock entirely: omit -l (lock-on-sleep) so the keychain stays
# unlocked for the full build regardless of runner idle time.
security set-keychain-settings "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Set as default and prepend to search list so codesign finds it first
security default-keychain -s "$KEYCHAIN_PATH"
security list-keychains -d user -s "$KEYCHAIN_PATH" $ORIGINAL_KEYCHAINS

# Import certificate
echo "Importing certificate..."
# If APPLE_CERTIFICATE is a file path (GitLab File variable)
if [ -f "$APPLE_CERTIFICATE" ]; then
    CERT_PATH="$APPLE_CERTIFICATE"
else
    # Assume base64 string
    echo "$APPLE_CERTIFICATE" | base64 --decode > certificate.p12
    CERT_PATH="certificate.p12"
fi

if ! security import "$CERT_PATH" -k "$KEYCHAIN_PATH" -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security; then
    echo "Error: Failed to import certificate"
    exit 1
fi

# Download and import Apple Intermediate Certificates
echo "Downloading Apple Intermediate Certificates..."
curl -s -o AppleWWDRCAG3.cer "https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer"
curl -s -o DeveloperIDG2CA.cer "https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer"
security import AppleWWDRCAG3.cer -k "$KEYCHAIN_PATH" -T /usr/bin/codesign
security import DeveloperIDG2CA.cer -k "$KEYCHAIN_PATH" -T /usr/bin/codesign

# Set partition list for codesign to avoid UI prompts
# Grant codesign/productbuild non-interactive access (suppresses UI password prompts)
security set-key-partition-list -S apple-tool:,apple:,codesign:,productbuild: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"

# Extract and verify signing identity
SIGNING_IDENTITY=$(security find-identity -v -p codesigning "$KEYCHAIN_PATH" | grep "Developer ID Application" | head -1 | awk -F'"' '{print $2}')

if [ -z "$SIGNING_IDENTITY" ]; then
    echo "Error: No signing identity found in keychain"
    security find-identity -v -p codesigning "$KEYCHAIN_PATH"
    exit 1
fi

echo "Found signing identity: $SIGNING_IDENTITY"

# Export for next steps/jobs (use build.env so GitLab CI can source it)
# Values must be quoted — signing identity contains parentheses e.g. "Developer ID Application: Name (TEAMID)"
echo "APPLE_SIGNING_IDENTITY='$SIGNING_IDENTITY'" > build.env
echo "KEYCHAIN_PATH='$KEYCHAIN_PATH'" >> build.env
echo "ORIGINAL_KEYCHAINS='$ORIGINAL_KEYCHAINS'" >> build.env

# Clean up temporary files
rm -f certificate.p12 AppleWWDRCAG3.cer DeveloperIDG2CA.cer
