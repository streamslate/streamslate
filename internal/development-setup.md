# Development Setup Guide

This guide covers the development environment setup for StreamSlate contributors and maintainers.

## Prerequisites

### Required Software

- **Node.js** 18+ (with npm)
- **Rust** (latest stable via rustup)
- **Git**

### Platform-Specific Dependencies

#### macOS

```bash
# Xcode Command Line Tools (if not already installed)
xcode-select --install
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  build-essential \
  curl \
  wget \
  file
```

#### Windows

- Install Visual Studio Build Tools or Visual Studio with C++ development tools
- Install WebView2 (usually pre-installed on Windows 11)

## Development Environment Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/streamslate/streamslate.git
cd streamslate

# Install Node.js dependencies
npm install

# Verify Rust installation
rustc --version
cargo --version
```

### 2. Development Scripts

```bash
# Start development server with hot reload
npm run tauri:dev

# Run TypeScript type checking
npx tsc --noEmit

# Run linting
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Build for production
npm run build

# Build Tauri app
npm run tauri:build
```

### 3. Rust Development

```bash
cd src-tauri

# Format Rust code
cargo fmt --all

# Check formatting
cargo fmt --all -- --check

# Run clippy linting
cargo clippy --all-targets --all-features

# Run tests
cargo test

# Build Rust components only
cargo build
```

## Project Structure

```
streamslate/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── stores/            # Zustand state stores
│   ├── styles/            # CSS and styling
│   └── types/             # TypeScript type definitions
├── src-tauri/             # Tauri backend source
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   ├── state/         # Application state management
│   │   ├── lib.rs         # Main library file
│   │   └── main.rs        # Application entry point
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── docs/                  # User documentation
├── internal/              # Developer documentation
├── .github/               # GitHub workflows and templates
└── cypress/               # E2E tests
```

## Development Workflow

### Code Style and Standards

1. **TypeScript/JavaScript**:
   - Use TypeScript for all new code
   - Follow ESLint rules defined in `eslint.config.js`
   - Format with Prettier using `.prettierrc`
   - Prefer functional React components with hooks

2. **Rust**:
   - Follow Rust standard formatting (`cargo fmt`)
   - Address all clippy warnings
   - Use meaningful error types and handling
   - Document public APIs with doc comments

3. **Git Workflow**:
   - Use Conventional Commits format
   - Create feature branches from `main`
   - Submit pull requests for all changes
   - Ensure CI passes before merging

### Testing

```bash
# Run frontend tests (Cypress)
npm run test:headless

# Open Cypress test runner
npm run test

# Run Rust unit tests
cd src-tauri && cargo test

# Run all tests (used in CI)
npm run lint && npm run build && cd src-tauri && cargo test
```

### Debugging

#### Frontend Debugging

- Use browser DevTools when running `npm run tauri:dev`
- React DevTools extension recommended
- Console logs appear in browser console

#### Backend Debugging

- Use `println!` or `dbg!` macros for simple debugging
- Enable Rust logging with `RUST_LOG=debug`
- Use `cargo test -- --nocapture` to see test output

#### Tauri Communication

- Use browser DevTools Network tab to inspect Tauri commands
- Enable Tauri devtools in `tauri.conf.json` for development

### Performance Considerations

1. **Bundle Size**:
   - Monitor frontend bundle size with `npm run build`
   - Use dynamic imports for large dependencies
   - Optimize images and assets

2. **Memory Usage**:
   - Use Rust's ownership system effectively
   - Minimize state held in memory
   - Clean up event listeners and subscriptions

3. **Startup Time**:
   - Lazy load non-critical components
   - Optimize Rust compilation for release builds
   - Minimize initial render complexity

## Environment Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# Development WebSocket port
VITE_WEBSOCKET_PORT=11451

# Enable debug logging
RUST_LOG=debug

# Tauri development settings
TAURI_SKIP_DEVSERVER_CHECK=true
```

### VS Code Setup

Recommended extensions:

- Rust Analyzer
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tauri

Recommended settings (`.vscode/settings.json`):

```json
{
  "rust-analyzer.check.command": "clippy",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Building and Distribution

### Development Builds

```bash
# Quick development build
npm run tauri:dev

# Production build (optimized)
npm run tauri:build
```

### Release Builds

```bash
# Create release build with all optimizations
npm run tauri:build --release

# Build for specific platform (when cross-compiling)
npm run tauri:build -- --target x86_64-pc-windows-gnu
```

### Code Signing (Maintainers Only)

macOS and Windows releases require code signing:

1. Set up signing certificates
2. Configure secrets in CI/CD
3. Use GitHub Actions for automated signing

## Troubleshooting

### Common Issues

**"Failed to resolve module" errors**:

- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall if issues persist

**Rust compilation errors**:

- Update Rust: `rustup update`
- Clear Cargo cache: `cargo clean`
- Check platform-specific dependencies

**Tauri fails to start**:

- Verify all system dependencies are installed
- Check WebView2 installation on Windows
- Ensure ports 1420 and 11451 are available

**Hot reload not working**:

- Check that Vite dev server is running on port 1420
- Verify firewall isn't blocking connections
- Try restarting the development server

### Getting Help

1. Check existing [GitHub Issues](https://github.com/streamslate/streamslate/issues)
2. Review this documentation and the main README
3. Ask in the development Discord channel
4. Create a new issue with detailed reproduction steps

## Contributing

See `CONTRIBUTING.md` for detailed contribution guidelines including:

- Code review process
- Issue reporting
- Pull request requirements
- Community guidelines

## License

StreamSlate is dual-licensed under GPL-3 and commercial licenses. All contributions must include appropriate license headers.
