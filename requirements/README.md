# StreamSlate System Requirements

This directory contains system package requirements for building and developing StreamSlate on different Linux distributions.

## Files

- `ubuntu-build.txt` - Minimal build dependencies for Ubuntu/Debian
- `ubuntu-dev.txt` - Development dependencies including testing tools (includes build requirements)
- `fedora-build.txt` - Build dependencies for Fedora/RHEL/CentOS
- `arch-build.txt` - Build dependencies for Arch Linux

## Usage

### Ubuntu/Debian

**Build requirements only:**

```bash
sudo apt-get update
xargs -a requirements/ubuntu-build.txt sudo apt-get install -y
```

**Development requirements (includes build):**

```bash
sudo apt-get update
# Note: -r includes don't work with xargs, so install both files
xargs -a requirements/ubuntu-build.txt sudo apt-get install -y
xargs -a requirements/ubuntu-dev.txt sudo apt-get install -y
```

### Fedora/RHEL/CentOS

```bash
sudo dnf check-update
xargs -a requirements/fedora-build.txt sudo dnf install -y
```

### Arch Linux

```bash
sudo pacman -Syu
xargs -a requirements/arch-build.txt sudo pacman -S --needed
```

## CI/CD Integration

The GitHub Actions workflow automatically installs these dependencies. See `.github/workflows/ci.yml` for the implementation.

## Adding New Dependencies

When adding new system dependencies:

1. Add to the appropriate distribution-specific file(s)
2. Update the CI workflow to use the requirements files
3. Test on the target distribution
4. Update this README if needed

## Dependency Categories

**Core Tauri Dependencies:**

- WebKit2GTK 4.1 development libraries
- Build tools (GCC, make, etc.)
- OpenSSL development libraries
- System integration libraries (appindicator, rsvg)

**Development Tools:**

- WebDriver for testing (webkit2gtk-driver)
- Headless display server (xvfb)
- Cross-compilation tools
- Package building tools (patchelf)

**Network Dependencies:**

- curl, wget for downloads
- pkg-config for library detection
- OpenSSL for secure connections (WebSocket TLS)
