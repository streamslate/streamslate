# syntax=docker/dockerfile:1.7
# Multi-stage build for StreamSlate
FROM node:18-slim AS frontend-builder

# Install dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies deterministically
# Use BuildKit cache to speed up repeated installs
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy only the frontend sources to avoid cache busts
COPY index.html ./
COPY src ./src
COPY public ./public
COPY vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js ./

# Build frontend
RUN npm run build

# Rust builder stage
# Rust 1.85+ required — transitive deps (dlopen2) use edition 2024.
# Debian bookworm ships webkit2gtk-4.1 packages that Tauri v2 needs.
FROM rust:1.85-slim AS rust-builder

# Install build dependencies for Tauri v2
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pre-cache Rust dependencies by copying manifests first
COPY src-tauri/Cargo.toml src-tauri/Cargo.lock ./src-tauri/
COPY src-tauri/icons ./src-tauri/icons
COPY src-tauri/tauri.conf.json ./src-tauri/

# Create dummy source files so Cargo can parse the manifest and fetch deps.
# Cargo requires src/main.rs (or [[bin]] section) even for `cargo fetch`.
RUN mkdir -p src-tauri/src && echo "fn main() {}" > src-tauri/src/main.rs

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/src-tauri/target \
    cargo fetch --manifest-path ./src-tauri/Cargo.toml

# Copy real Rust sources (replaces dummy main.rs; code changes don't invalidate dep cache)
COPY src-tauri/src ./src-tauri/src
COPY src-tauri/build.rs ./src-tauri/build.rs

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Build Rust binary with cached registry/target
# The binary must be copied out of the cache mount in the same RUN step,
# because cache mounts are detached after RUN completes.
WORKDIR /app/src-tauri
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/src-tauri/target \
    cargo build --release && \
    cp target/release/streamslate /app/streamslate

# Final runtime stage
FROM ubuntu:22.04

# Install runtime dependencies for Tauri v2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libwebkit2gtk-4.1-0 \
    libjavascriptcoregtk-4.1-0 \
    libsoup-3.0-0 \
    libayatana-appindicator3-1 \
    librsvg2-2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash streamslate

# Copy the built binary (from /app/ where it was placed after cache-mounted build)
COPY --from=rust-builder /app/streamslate /usr/local/bin/streamslate

# Set permissions
RUN chmod +x /usr/local/bin/streamslate

# Switch to non-root user
USER streamslate

# Set working directory
WORKDIR /home/streamslate

# Entry point
ENTRYPOINT ["/usr/local/bin/streamslate"]
