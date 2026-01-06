.PHONY: all build dev lint lint-fix test clean help

# Default target
all: help

# Build the application
# This triggers 'npm run build' via 'beforeBuildCommand' in tauri.conf.json
build:
	npm run tauri:build

# Start the development server
# This triggers 'npm run dev' via 'beforeDevCommand' in tauri.conf.json
dev:
	npm run tauri:dev

# Run linting checks (Frontend + Backend)
# Note: Uses default features only (ndi feature requires proprietary SDK)
lint:
	npm run lint
	npm run format:check
	cd src-tauri && cargo clippy --all-targets -- -D warnings

# Fix linting issues automatically (Frontend + Backend)
lint-fix:
	npm run lint:fix
	npm run format
	cd src-tauri && cargo fmt

# Run tests (Frontend + Backend)
test:
	npm run test:headless
	cd src-tauri && cargo test

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf src-tauri/target

# Show help
help:
	@echo "Available targets:"
	@echo "  build    - Build the application (frontend + Tauri)"
	@echo "  dev      - Start the development server"
	@echo "  lint     - Run linting checks (ESLint, Prettier, Clippy)"
	@echo "  lint-fix - Fix linting issues automatically and format code"
	@echo "  test     - Run tests (Cypress headless + Rust)"
	@echo "  clean    - Remove build artifacts"
	@echo "  help     - Show this help message"
