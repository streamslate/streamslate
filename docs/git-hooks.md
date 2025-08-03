# Git Hooks Configuration

StreamSlate uses Git hooks to ensure code quality and prevent broken code from being committed or pushed. These hooks run automatically at different stages of your Git workflow.

## Overview

We use [Husky](https://typicode.github.io/husky/) to manage Git hooks and [lint-staged](https://github.com/okonet/lint-staged) to run linters on staged files.

## Installed Hooks

### 1. Pre-commit Hook

**When it runs:** Before each commit

**What it does:**

- Runs `lint-staged` on JavaScript/TypeScript files:
  - ESLint with auto-fix
  - Prettier formatting
- For Rust files (if any `.rs` files are staged):
  - Checks formatting with `cargo fmt`
  - Runs Clippy linting with strict warnings
  - Runs Rust tests

**To bypass (use sparingly):** `git commit --no-verify`

### 2. Commit-msg Hook

**When it runs:** After writing a commit message

**What it does:**

- Validates commit message format follows [Conventional Commits](https://www.conventionalcommits.org/)
- Ensures subject line is under 50 characters

**Valid commit types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Reverting a previous commit

**Examples:**

```bash
# Good
git commit -m "feat: add PDF export functionality"
git commit -m "fix(ui): resolve dark mode toggle issue"
git commit -m "docs: update installation instructions"

# Bad
git commit -m "Updated stuff"  # No type
git commit -m "feat: this is a very long commit message that exceeds the 50 character limit"  # Too long
```

### 3. Pre-push Hook

**When it runs:** Before pushing to remote

**What it does:**

- TypeScript type checking (`tsc --noEmit`)
- Runs frontend tests (`npm run test:headless`)
- Runs Rust tests (if Rust files are being pushed)

**To bypass (use with caution):** `git push --no-verify`

## lint-staged Configuration

The following file patterns are automatically formatted on commit:

- `*.{js,jsx,ts,tsx}`: ESLint + Prettier
- `*.{json,md,yml,yaml}`: Prettier
- `*.css`: Prettier

## Setup

Hooks are automatically installed when you run `npm install` thanks to the `prepare` script in package.json.

If hooks aren't working, you can manually reinstall them:

```bash
npm run prepare
```

## Troubleshooting

### Hooks not running

1. Check if Husky is installed:

   ```bash
   ls -la .husky/
   ```

2. Reinstall hooks:
   ```bash
   rm -rf .husky
   npm run prepare
   ```

### Formatting issues

If you're getting formatting errors:

```bash
# Format all files
npm run format

# Fix linting issues
npm run lint:fix

# Format Rust code
cd src-tauri && cargo fmt
```

### Bypassing hooks temporarily

While not recommended for regular use, you can bypass hooks when necessary:

```bash
# Skip pre-commit and pre-push hooks
git commit --no-verify -m "fix: emergency hotfix"
git push --no-verify

# Note: This won't skip the commit-msg hook
```

## Best Practices

1. **Don't bypass hooks regularly** - They're there to maintain code quality
2. **Fix issues locally** - Don't push code that fails checks
3. **Keep commits focused** - One logical change per commit
4. **Write clear commit messages** - Future you will thank present you

## CI Integration

These same checks run in our CI pipeline, so bypassing local hooks will still result in CI failures. It's faster and less frustrating to fix issues locally!
