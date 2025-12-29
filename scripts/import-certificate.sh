#!/bin/bash
set -e

echo "🔐 Setting up Code Signing..."

# Check for required variables
if [ -z "$APPLE_CERTIFICATE" ] || [ -z "$APPLE_CERTIFICATE_PASSWORD" ]; then
    echo "❌ Error: APPLE_CERTIFICATE or APPLE_CERTIFICATE_PASSWORD not set."
    echo "Please add these as File/Variable type CI/CD variables in GitLab."
    exit 1
fi

# Create keychain with password
KEYCHAIN_PASSWORD="gitlab-runner"
KEYCHAIN_PATH=$PWD/app-signing.keychain-db

echo "🔑 Creating temporary keychain at $KEYCHAIN_PATH..."

# Create new keychain
security create-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH
security set-keychain-settings -lut 21600 $KEYCHAIN_PATH
security unlock-keychain -p "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

# Add keychain to search list
security list-keychains -d user -s $KEYCHAIN_PATH $(security list-keychains -d user | sed 's/"//g')

# Import certificate
echo "📥 Importing certificate..."
# If APPLE_CERTIFICATE is a file path (GitLab File variable)
if [ -f "$APPLE_CERTIFICATE" ]; then
    CERT_PATH="$APPLE_CERTIFICATE"
else
    # Assume base64 string
    echo "$APPLE_CERTIFICATE" | base64 --decode > certificate.p12
    CERT_PATH="certificate.p12"
fi

if ! security import "$CERT_PATH" -k $KEYCHAIN_PATH -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security; then
    echo "❌ Error: Failed to import certificate"
    exit 1
fi

# Download and import Apple Intermediate Certificate
echo "📥 Downloading Apple Intermediate Certificate..."
curl -s -o AppleWWDRCAG3.cer "https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer"
security import AppleWWDRCAG3.cer -k $KEYCHAIN_PATH -T /usr/bin/codesign

# Set partition list for codesign to avoid UI prompts
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" $KEYCHAIN_PATH

# Extract and verify signing identity
SIGNING_IDENTITY=$(security find-identity -v -p codesigning $KEYCHAIN_PATH | grep "Developer ID Application" | head -1 | awk -F'"' '{print $2}')

if [ -z "$SIGNING_IDENTITY" ]; then
    echo "❌ Error: No signing identity found in keychain"
    security find-identity -v -p codesigning $KEYCHAIN_PATH
    exit 1
fi

echo "✅ Found signing identity: $SIGNING_IDENTITY"

# Export for next steps/jobs
echo "APPLE_SIGNING_IDENTITY=$SIGNING_IDENTITY" >> build.env

# Clean up temporary files
rm -f certificate.p12 AppleWWDRCAG3.cer
