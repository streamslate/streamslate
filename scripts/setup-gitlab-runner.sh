#!/bin/bash
set -e

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "🛠️  Setting up GitLab Runner on macOS..."

# 1. Install GitLab Runner
if ! command_exists gitlab-runner; then
    echo "📦 Installing gitlab-runner via Homebrew..."
    if ! command_exists brew; then
        echo "❌ Homebrew not found. Please install Homebrew first."
        exit 1
    fi
    brew install gitlab-runner
else
    echo "✅ gitlab-runner is already installed."
fi

# 2. Gather Configuration
echo ""
echo "📝 Configuration Required"
echo "You can find these details in your GitLab project: Settings > CI/CD > Runners"
read -p "Enter GitLab Instance URL (e.g., https://gitlab.lan/): " GITLAB_URL
read -p "Enter Registration Token: " REGISTRATION_TOKEN

if [ -z "$GITLAB_URL" ] || [ -z "$REGISTRATION_TOKEN" ]; then
    echo "❌ URL and Token are required."
    exit 1
fi

# 3. Register Runner
echo ""
echo "🔗 Registering runner..."
gitlab-runner register \
  --non-interactive \
  --url "$GITLAB_URL" \
  --registration-token "$REGISTRATION_TOKEN" \
  --executor "shell" \
  --description "macbook-air-builder" \
  --tag-list "macos,darwin,shell" \
  --run-untagged="false" \
  --locked="false"

# 4. Install and Start Service
echo ""
echo "🚀 Installing and starting service..."
gitlab-runner install || echo "⚠️  Service might already be installed."
gitlab-runner start || echo "⚠️  Service might already be running."

echo ""
echo "✅ GitLab Runner setup complete!"
echo "You can verify the status with: gitlab-runner status"
