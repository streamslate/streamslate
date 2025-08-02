#!/usr/bin/env bash
# -----------------------------------------------------------------------------
#  dev_setup.sh — StreamSlate Repository Bootstrap Script
# -----------------------------------------------------------------------------
#  * Installs and configures the minimum tool-chain for **developers** *and*
#    **coding agents** that contribute to the project.
#  * Idempotent: safe to run multiple times.
#  * Supports macOS (brew), Debian/Ubuntu (apt), and Arch (pacman).
#
#  Usage:
#     curl -sSL https://raw.githubusercontent.com/streamslate/streamslate/main/dev_setup.sh | bash
#     # OR, from repo root:
#     ./dev_setup.sh          # interactive
#     ./dev_setup.sh --ci     # non-interactive (CI images)
# -----------------------------------------------------------------------------
set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NODE_VERSION="20.11.1"
RUST_TOOLCHAIN="stable"
PNPM_VERSION="9.1.1"

# ------------------------------- Helpers ------------------------------------ #
command_exists() { command -v "$1" &>/dev/null; }

info()   { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn()   { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error()  { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

# ---------------------------- OS Detection ---------------------------------- #
OS="$(uname -s)" # Linux / Darwin / MINGW* / etc.
PKG=""          # package-manager cmd
case "$OS" in
  Darwin*) PKG="brew" ;;
  Linux*)
    if   command_exists apt;    then PKG="apt";
    elif command_exists pacman; then PKG="pacman";
    else error "Unsupported Linux distro (need apt or pacman)"; exit 1; fi ;;
  *) error "Unsupported OS: $OS"; exit 1 ;;
esac

# ------------------------ Interactive Confirmations ------------------------- #
INTERACTIVE=true
[[ "${1:-}" == "--ci" ]] && INTERACTIVE=false

ask() {
  $INTERACTIVE || return 0
  read -rp "$1 [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

# ---------------------------- Install Node ---------------------------------- #
install_node() {
  if command_exists node && [[ "$(node -v)" == "v$NODE_VERSION" ]]; then
    info "Node $NODE_VERSION already installed"
    return
  fi

  info "Installing Node $NODE_VERSION via nvm…"
  if ! command_exists nvm; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # shellcheck disable=SC1090
    source "$HOME/.nvm/nvm.sh"
  fi
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
  nvm alias default "$NODE_VERSION"
}

# ---------------------------- Install Rust ---------------------------------- #
install_rust() {
  if command_exists rustc; then
    info "Rust $(rustc --version) present (toolchain: $RUST_TOOLCHAIN)"
  else
    info "Installing Rust $RUST_TOOLCHAIN via rustup…"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain "$RUST_TOOLCHAIN"
    # shellcheck disable=SC1090
    source "$HOME/.cargo/env"
  fi

  info "Installing tauri-cli + cargo tools…"
  cargo install tauri-cli wasm-bindgen-cli cargo-make --locked || true
}

# -------------------------- Install PNPM & Deps ----------------------------- #
install_js_deps() {
  if ! command_exists pnpm || [[ "$(pnpm -v)" != "$PNPM_VERSION" ]]; then
    info "Installing pnpm@$PNPM_VERSION…"
    npm install -g "pnpm@$PNPM_VERSION"
  fi

  info "Bootstrapping npm workspace…"
  pnpm install --frozen-lockfile
}

# ------------------------ Install System Packages --------------------------- #
install_sys_packages() {
  case "$PKG" in
    brew)
      brew bundle --file "$REPO_ROOT/scripts/Brewfile" || true ;;
    apt)
      sudo apt-get update -y
      # Skip webkit here - handled in install_webkit_linux()
      sudo apt-get install -y build-essential pkg-config curl git wget ca-certificates \
           libssl-dev libgtk-3-dev libayatana-appindicator3-dev libappindicator3-dev ;;
    pacman)
      sudo pacman -Syu --noconfirm --needed base-devel webkit2gtk git curl wget openssl gtk3 libappindicator-gtk3 ;;
  esac
}

# ---------- Linux-only (WebKit2GTK) ----------
install_webkit_linux() {
  case "$PKG" in
    apt)
      sudo apt-get update -y
      # install newer WebKit if stock repo is too old
      if ! dpkg -s libwebkit2gtk-4.1-dev &>/dev/null; then
        sudo add-apt-repository universe -y          # does nothing if already enabled
        sudo apt-get update -y
      fi
      sudo apt-get install -y \
           build-essential curl git wget ca-certificates \
           libwebkit2gtk-4.1-dev \
           libssl-dev libgtk-3-dev \
           libayatana-appindicator3-dev || sudo apt-get install -y libappindicator3-dev ;;
    pacman)
      sudo pacman -Syu --noconfirm --needed webkit2gtk ;;
    *)
      : # other distros covered earlier
  esac
}

# ------------------------- Git Hooks / Lint-staged -------------------------- #
setup_hooks() {
  info "Configuring Husky git hooks & commit lint…"
  if [ -d .git ]; then
    pnpm dlx husky install
    pnpm dlx husky add .husky/commit-msg "pnpm dlx commitlint --edit $1"
  fi
}

# ------------------------------ .env Files ---------------------------------- #
copy_env() {
  if [ ! -f .env ]; then
    info "Creating .env from template…"
    cp .env.example .env || touch .env
  fi
}

# ------------------------------- Execution ---------------------------------- #
main() {
  info "🛠  StreamSlate dev environment setup starting…"

  install_sys_packages
  [[ "$OS" == "Linux" ]] && install_webkit_linux
  install_node
  install_rust
  install_js_deps
  setup_hooks
  copy_env

  info "✅  Done! Run 'pnpm tauri dev' to start the app. Happy hacking!"
}

main "$@"
