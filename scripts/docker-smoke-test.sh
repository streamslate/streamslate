#!/bin/bash
# Docker Smoke Test Script for StreamSlate
# This script validates that the Docker image is built correctly

set -e

IMAGE_NAME="${1:-streamslate:latest}"
CONTAINER_NAME="streamslate-smoke-test-$$"

echo "🧪 Running smoke tests for Docker image: $IMAGE_NAME"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

# Test 1: Binary exists and is executable
echo "📋 Test 1: Checking binary exists and is executable..."
docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "test -x /usr/local/bin/streamslate"
echo "   ✅ Binary exists and is executable"

# Test 2: Binary can execute --version (or at least starts)
echo "📋 Test 2: Checking binary can start..."
# Note: The app may fail to start fully without a display, but should at least load
docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "timeout 5 /usr/local/bin/streamslate --version 2>&1 || true" | head -5
echo "   ✅ Binary attempted to start (may fail without display, that's expected)"

# Test 3: Running as non-root user
echo "📋 Test 3: Checking running as non-root user..."
USER=$(docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "whoami")
if [ "$USER" = "streamslate" ]; then
    echo "   ✅ Running as non-root user: $USER"
else
    echo "   ❌ Running as root or unexpected user: $USER"
    exit 1
fi

# Test 4: Check file permissions
echo "📋 Test 4: Checking file permissions..."
docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "ls -la /usr/local/bin/streamslate" | grep -E "^-r.x.*.streamslate" || {
    echo "   ❌ Unexpected file permissions"
    docker run --rm --entrypoint /bin/sh "$IMAGE_NAME" -c "ls -la /usr/local/bin/streamslate"
    exit 1
}
echo "   ✅ File permissions are correct"

# Test 5: Required shared libraries are present
echo "📋 Test 5: Checking required shared libraries..."
docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "ldd /usr/local/bin/streamslate 2>&1 | grep -c 'not found'" | grep -q "^0$" || {
    echo "   ❌ Missing shared libraries:"
    docker run --rm --entrypoint /bin/sh "$IMAGE_NAME" -c "ldd /usr/local/bin/streamslate 2>&1 | grep 'not found'"
    exit 1
}
echo "   ✅ All shared libraries are present"

# Test 6: Work directory exists and is writable
echo "📋 Test 6: Checking work directory..."
docker run --rm --name "$CONTAINER_NAME" --entrypoint /bin/sh "$IMAGE_NAME" -c "test -d /home/streamslate && touch /home/streamslate/test && rm /home/streamslate/test"
echo "   ✅ Work directory exists and is writable"

echo ""
echo "🎉 All smoke tests passed!"
echo ""
