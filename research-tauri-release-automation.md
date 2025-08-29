# Simplifying Tauri Release Management from VSCode

## Executive Summary

Based on research and analysis of the StreamSlate project, this report presents the best approaches to streamline creating tags and triggering releases directly from VSCode for your Tauri application. The current workflow relies on manual tag pushes to trigger GitHub Actions, but this can be significantly improved with proper tooling and automation.

## Current State Analysis

Your StreamSlate project currently has:

- **Version 0.0.1** across all configuration files (package.json, Cargo.toml, tauri.conf.json)
- **GitHub Actions workflow** that triggers on tag pushes (v\*) or manual workflow dispatch
- **Manual version management** requiring updates in 3 separate files
- **No automated changelog generation** or semantic versioning

## Key Findings & Recommendations

### 1. VSCode Extensions for Release Management

**Essential Extensions:**

- **GitHub Actions** (by GitHub) - Monitor and trigger workflows directly from VSCode
- **GitLens** (by GitKraken) - Advanced Git features including tag management with UI
- **Conventional Commits** (by vivaxy) - Helps write semantic commit messages for automated versioning
- **Version Lens** (by pflannery) - Shows latest versions inline and helps with version bumping
- **GitHub CLI Actions** (by arcuo) - Run GitHub CLI commands from command palette

**Sources:**

- [VSCode Updates v1.94](https://code.visualstudio.com/updates/v1_94) - Details on latest VSCode features
- [VSCode Extensions Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) - Extension versioning guidelines
- [GitHub CLI Actions Extension](https://marketplace.visualstudio.com/items?itemName=arcuo.gh-cli-actions) - VSCode GitHub CLI integration

### 2. NPM Scripts for Release Automation

**Recommended Implementation:**

Add to your `package.json`:

```json
{
  "scripts": {
    // Version management
    "version:patch": "npm version patch --no-git-tag-version && npm run version:sync",
    "version:minor": "npm version minor --no-git-tag-version && npm run version:sync",
    "version:major": "npm version major --no-git-tag-version && npm run version:sync",
    "version:sync": "node scripts/sync-versions.js",

    // Release automation
    "release": "npm run release:version && npm run release:publish",
    "release:version": "standard-version --preset conventionalcommits",
    "release:patch": "npm run release:version -- --release-as patch",
    "release:minor": "npm run release:version -- --release-as minor",
    "release:major": "npm run release:version -- --release-as major",
    "release:publish": "git push --follow-tags origin main",

    // GitHub CLI integration
    "release:gh": "gh release create v$(node -p \"require('./package.json').version\") --generate-notes",
    "release:draft": "gh release create v$(node -p \"require('./package.json').version\") --draft --generate-notes",

    // Complete workflows
    "ship:patch": "npm run release:patch && npm run release:gh",
    "ship:minor": "npm run release:minor && npm run release:gh",
    "ship:major": "npm run release:major && npm run release:gh"
  }
}
```

**Required packages:**

```bash
npm install --save-dev standard-version @commitlint/cli @commitlint/config-conventional
```

**Sources:**

- [Semantic Release GitHub](https://github.com/semantic-release/semantic-release) - Fully automated version management
- [Using Semantic Release Guide](https://dev.to/mahabubx7/using-semantic-release-to-automate-versioning-and-publishing-mid) - Implementation guide
- [Automating Versioning with Semantic Release](https://igventurelli.io/embracing-automated-versioning-with-semantic-release/) - Best practices

### 3. VSCode Task Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🚀 Release: Patch (Bug Fix)",
      "type": "shell",
      "command": "npm run ship:patch",
      "group": "build",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "🎯 Release: Minor (Feature)",
      "type": "shell",
      "command": "npm run ship:minor",
      "group": "build",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "💥 Release: Major (Breaking)",
      "type": "shell",
      "command": "npm run ship:major",
      "group": "build",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "📝 Generate Changelog",
      "type": "shell",
      "command": "standard-version --dry-run",
      "problemMatcher": []
    },
    {
      "label": "🔖 Create GitHub Release",
      "type": "shell",
      "command": "gh release create v${input:version} --title 'StreamSlate v${input:version}' --generate-notes",
      "problemMatcher": []
    },
    {
      "label": "🔄 Sync Versions",
      "type": "shell",
      "command": "npm run version:sync",
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "version",
      "type": "promptString",
      "description": "Enter version number (e.g., 1.2.3)",
      "default": "0.0.2"
    }
  ]
}
```

**Keyboard Shortcuts** (add to `.vscode/keybindings.json`):

```json
[
  {
    "key": "ctrl+shift+r p",
    "command": "workbench.action.tasks.runTask",
    "args": "🚀 Release: Patch (Bug Fix)"
  },
  {
    "key": "ctrl+shift+r m",
    "command": "workbench.action.tasks.runTask",
    "args": "🎯 Release: Minor (Feature)"
  },
  {
    "key": "ctrl+shift+r shift+m",
    "command": "workbench.action.tasks.runTask",
    "args": "💥 Release: Major (Breaking)"
  }
]
```

**Sources:**

- [VSCode Tasks Documentation](https://code.visualstudio.com/docs/debugtest/tasks) - Task configuration guide
- [GitHub Keyboard Shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts) - GitHub keyboard shortcuts reference

### 4. GitHub CLI Integration

**Setup Commands:**

```bash
# Install GitHub CLI (macOS)
brew install gh

# Windows
winget install GitHub.cli

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

**Useful GitHub CLI Commands:**

```bash
# Create release with auto-generated notes
gh release create v0.0.2 --generate-notes

# Create draft release
gh release create v0.0.2 --draft --generate-notes

# Create pre-release
gh release create v0.0.2-beta.1 --prerelease --generate-notes

# List releases
gh release list

# View release
gh release view v0.0.2
```

**Sources:**

- [GitHub CLI Manual](https://cli.github.com/manual/) - Complete CLI documentation
- [gh release create Documentation](https://cli.github.com/manual/gh_release_create) - Release creation reference
- [Work with GitHub Actions in Terminal](https://github.blog/news-insights/product-news/work-with-github-actions-in-your-terminal-with-github-cli/) - GitHub CLI Actions integration

### 5. Tauri-Specific Version Synchronization

**Critical Issue:** Tauri requires version synchronization across multiple files ([GitHub Issue #8265](https://github.com/tauri-apps/tauri/issues/8265), [Discussion #6347](https://github.com/tauri-apps/tauri/discussions/6347))

**Create `scripts/sync-versions.js`:**

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read package.json version
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = packageJson.version;

console.log(`📦 Syncing version ${version} across all configuration files...`);

// Update Cargo.toml
const cargoPath = path.join(process.cwd(), "src-tauri", "Cargo.toml");
if (fs.existsSync(cargoPath)) {
  let cargoContent = fs.readFileSync(cargoPath, "utf8");
  cargoContent = cargoContent.replace(
    /^version = ".*"$/m,
    `version = "${version}"`
  );
  fs.writeFileSync(cargoPath, cargoContent);
  console.log("✅ Updated src-tauri/Cargo.toml");
}

// Update tauri.conf.json
const tauriConfPath = path.join(process.cwd(), "src-tauri", "tauri.conf.json");
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
  tauriConf.package.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
  console.log("✅ Updated src-tauri/tauri.conf.json");
}

console.log(`🎉 Successfully synced version ${version} across all files!`);
```

**Sources:**

- [Tauri Configuration Files](https://v2.tauri.app/develop/configuration-files/) - Tauri v2 configuration guide
- [Tauri v1 Configuration](https://tauri.app/v1/references/configuration-files/) - Tauri v1 configuration reference
- [Tauri Version Management Issue](https://github.com/tauri-apps/tauri/issues/4643) - Feature request for CLI versioning command

### 6. Recommended Release Workflows

#### Option A: Standard-Version (Recommended)

**Setup:**

1. Install: `npm install --save-dev standard-version`
2. Create `.versionrc.json`:

```json
{
  "types": [
    { "type": "feat", "section": "✨ Features" },
    { "type": "fix", "section": "🐛 Bug Fixes" },
    { "type": "perf", "section": "⚡ Performance" },
    { "type": "docs", "section": "📝 Documentation" },
    { "type": "style", "section": "💄 Styling" },
    { "type": "refactor", "section": "♻️ Refactoring" },
    { "type": "test", "section": "✅ Tests" },
    { "type": "build", "section": "📦 Build System" },
    { "type": "ci", "section": "👷 CI/CD" }
  ],
  "scripts": {
    "postbump": "node scripts/sync-versions.js",
    "postchangelog": "prettier --write CHANGELOG.md"
  }
}
```

**Workflow:**

1. Make commits using conventional commits format
2. Run `npm run release:patch` (or minor/major)
3. Push tags: `git push --follow-tags`
4. GitHub Actions automatically builds and releases

#### Option B: Changesets (For Future Consideration)

Better for complex projects with multiple packages:

```bash
npm install --save-dev @changesets/cli
npx changeset init
```

**Sources:**

- [Tauri GitHub Action](https://github.com/tauri-apps/tauri-action) - Official Tauri GitHub Action
- [Simple Guide on Auto Updater](https://github.com/tauri-apps/tauri/discussions/2776) - Tauri auto-update discussion

### 7. Quick Start Implementation Guide

#### Step 1: Install Dependencies

```bash
npm install --save-dev standard-version @commitlint/cli @commitlint/config-conventional
```

#### Step 2: Create Version Sync Script

Create `scripts/sync-versions.js` with the code provided above.

#### Step 3: Update package.json Scripts

Add the release scripts to your package.json as shown in section 2.

#### Step 4: Create VSCode Tasks

Create `.vscode/tasks.json` with the configuration from section 3.

#### Step 5: Configure Standard-Version

Create `.versionrc.json` with the configuration from section 6.

#### Step 6: Install GitHub CLI

Follow the installation instructions from section 4.

#### Step 7: Test the Workflow

```bash
# Test version bump (dry run)
npm run release:patch -- --dry-run

# Create a patch release
npm run ship:patch
```

## Best Practices for StreamSlate

1. **Use Conventional Commits:**
   - `feat:` for new features (triggers minor version bump)
   - `fix:` for bug fixes (triggers patch version bump)
   - `feat!:` or `BREAKING CHANGE:` for breaking changes (triggers major version bump)

2. **Version Management:**
   - Always sync versions across package.json, Cargo.toml, and tauri.conf.json
   - Use semantic versioning (major.minor.patch)
   - Consider beta releases for testing: `v0.1.0-beta.1`

3. **Release Process:**
   - **Production:** Full releases with code signing and notarization
   - **Beta:** Pre-releases for community testing
   - **Nightly:** Consider automated builds from main branch

4. **Pre-release Checklist:**
   - Run tests: `npm run test`
   - Lint code: `npm run lint`
   - Build locally: `npm run tauri:build`
   - Test on target platforms

## Streamlined One-Command Release

For maximum simplicity, after setup you can release with:

```bash
# Patch release (bug fixes)
npm run ship:patch

# Minor release (new features)
npm run ship:minor

# Major release (breaking changes)
npm run ship:major
```

This will:

1. Bump version based on conventional commits
2. Update CHANGELOG.md
3. Sync versions across all config files
4. Create git tag
5. Push to GitHub
6. Trigger your existing GitHub Actions workflow
7. Build and publish the Tauri app automatically

## Conclusion

By implementing these recommendations, you'll transform your release process from manual tag creation to a streamlined, one-command workflow that:

- Automatically manages semantic versioning
- Generates changelogs from commit messages
- Syncs versions across all Tauri configuration files
- Creates GitHub releases with proper notes
- Triggers your existing build pipeline

The combination of standard-version, GitHub CLI, and VSCode tasks provides a professional, maintainable release workflow that scales with your project.

## Additional Resources

- [Semantic Versioning Specification](https://semver.org/) - Official semver documentation
- [Managing Releases with Git Tags](https://www.gitkraken.com/gitkon/semantic-versioning-git-tags) - Git tagging best practices
- [Tauri 2.0 Release Notes](https://v2.tauri.app/blog/tauri-20/) - Latest Tauri features
- [Streamline GitHub Actions with CLI](https://dev.to/yankee/streamline-github-actions-releases-with-github-cli-3mio) - GitHub CLI automation guide

---

_Research compiled on January 23, 2025_
