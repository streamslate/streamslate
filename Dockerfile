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
COPY src ./src
COPY public ./public
COPY vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js ./

# Build frontend
RUN npm run build

# Rust builder stage
FROM rust:1.82-slim AS rust-builder

# Install dependencies for Tauri
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pre-cache Rust dependencies by copying manifests first
COPY src-tauri/Cargo.toml src-tauri/Cargo.lock ./src-tauri/
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/src-tauri/target \
    cargo fetch --locked

# Copy Rust sources (after fetch so code changes don't invalidate dep cache)
COPY src-tauri/src ./src-tauri/src
COPY src-tauri/build.rs ./src-tauri/build.rs

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Build Rust binary with cached registry/target
WORKDIR /app/src-tauri
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/src-tauri/target \
    cargo build --release --locked

# Final runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libwebkit2gtk-4.0-37 \
    libayatana-appindicator3-1 \
    librsvg2-2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash streamslate

# Copy the built binary
COPY --from=rust-builder /app/src-tauri/target/release/streamslate /usr/local/bin/streamslate

# Set permissions
RUN chmod +x /usr/local/bin/streamslate

# Switch to non-root user
USER streamslate

# Set working directory
WORKDIR /home/streamslate

# Entry point
ENTRYPOINT ["/usr/local/bin/streamslate"]
