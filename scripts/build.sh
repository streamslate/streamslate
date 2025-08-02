#!/bin/bash

# StreamSlate Build Script
# This file is part of StreamSlate.
# Copyright (C) 2025 StreamSlate Contributors
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

set -e

echo "🔨 Building StreamSlate..."

echo "📦 Installing dependencies..."
npm ci

echo "🧹 Running linters..."
npm run lint
npm run format:check

echo "🔧 Building frontend..."
npm run build

echo "🦀 Building Tauri app..."
npm run tauri:build

echo "✅ Build complete!"