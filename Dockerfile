# Multi-stage build for StreamSlate
FROM node:18-slim AS frontend-builder

# Install dependencies for building
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Rust builder stage
FROM rust:1.75-slim AS rust-builder

# Install dependencies for Tauri
RUN apt-get update && apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust files
COPY src-tauri ./src-tauri

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Build Rust binary
WORKDIR /app/src-tauri
RUN cargo build --release

# Final runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
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