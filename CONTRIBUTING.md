# Contributing to StreamSlate

Thank you for your interest in contributing to StreamSlate! This document provides guidelines and information for contributors.

## Code of Conduct

StreamSlate is committed to providing a welcoming and inclusive experience for all contributors. By participating in this project, you agree to abide by our code of conduct:

- Be respectful and professional
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Show empathy towards other community members

## Getting Started

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/streamslate.git
   cd streamslate
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run tauri:dev
   ```

For detailed setup instructions, see [`internal/development-setup.md`](internal/development-setup.md).

## Development Workflow

### Before You Start

1. Check existing [issues](https://github.com/streamslate/streamslate/issues) to avoid duplicating work
2. For large features, create an issue to discuss the approach first
3. Fork the repository and create a feature branch

### Making Changes

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - **TypeScript/React**: Use ESLint and Prettier configurations
   - **Rust**: Follow `cargo fmt` formatting and address clippy warnings
   - **Commits**: Use [Conventional Commits](https://conventionalcommits.org/) format

3. **Test Your Changes**

   ```bash
   # Run linting
   npm run lint

   # Run tests
   npm run test:headless
   cd src-tauri && cargo test

   # Build to ensure no compilation errors
   npm run build
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new PDF annotation tool"
   ```

### Commit Message Format

We use [Conventional Commits](https://conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat: add real-time collaboration support
fix: resolve PDF rendering issue on high-DPI displays
docs: update getting started guide
style: format Rust code with cargo fmt
refactor: extract PDF state management into separate module
test: add unit tests for annotation persistence
chore: update dependencies to latest versions
```

## Pull Request Process

### Before Submitting

1. **Ensure CI Passes**
   - All tests pass
   - Code is properly formatted
   - No linting errors
   - TypeScript compiles without errors

2. **Update Documentation**
   - Update relevant documentation files
   - Add JSDoc comments for new public APIs
   - Update CHANGELOG.md if applicable

3. **Self-Review**
   - Review your own code for obvious issues
   - Ensure code follows project patterns
   - Check for any debugging code or console logs

### Submitting the PR

1. **Push Your Branch**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link related issues using keywords (`Fixes #123`, `Closes #456`)
   - Add screenshots for UI changes

3. **PR Title Format**
   ```
   feat: add PDF text search functionality
   fix: resolve annotation sync issues in presenter mode
   docs: improve installation instructions for Linux
   ```

### PR Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Screenshots

For UI changes, include before/after screenshots.

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

## Code Review Process

### For Contributors

1. **Be Responsive**
   - Address feedback promptly
   - Ask for clarification if needed
   - Make requested changes in a timely manner

2. **Handle Feedback**
   - Don't take feedback personally
   - Discuss technical disagreements respectfully
   - Learn from the review process

### For Reviewers

1. **Be Constructive**
   - Provide specific, actionable feedback
   - Explain the reasoning behind suggestions
   - Acknowledge good practices and improvements

2. **Review Criteria**
   - Code quality and maintainability
   - Performance implications
   - Security considerations
   - Documentation completeness
   - Test coverage

## Areas for Contribution

### High Priority

- **PDF Rendering**: Improve PDF.js integration and performance
- **Annotation Tools**: Add more annotation types (shapes, stamps, etc.)
- **Streaming Integration**: Enhance OBS/Stream Deck connectivity
- **Performance**: Optimize memory usage and startup time

### Good First Issues

Look for issues labeled `good first issue` or `beginner-friendly`:

- Documentation improvements
- UI/UX enhancements
- Bug fixes with clear reproduction steps
- Adding unit tests
- Code formatting and linting fixes

### Advanced Contributions

- WebSocket API enhancements
- Cross-platform compatibility improvements
- Advanced PDF features (forms, digital signatures)
- Plugin system development
- Performance optimizations

## Development Guidelines

### Architecture Principles

1. **Separation of Concerns**
   - Keep UI logic separate from business logic
   - Use Tauri commands for backend communication
   - Maintain clear module boundaries

2. **Performance First**
   - Optimize for large PDF files
   - Minimize memory allocations
   - Use efficient data structures

3. **User Experience**
   - Prioritize streaming use cases
   - Ensure responsive UI
   - Provide clear error messages

### Code Organization

```
src/
├── components/        # Reusable React components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and helpers
│   ├── tauri/        # Tauri command wrappers
│   └── websocket/    # WebSocket client implementation
├── stores/           # Zustand state management
├── styles/           # CSS and Tailwind configurations
└── types/            # TypeScript type definitions

src-tauri/src/
├── commands/         # Tauri command implementations
├── state/            # Application state management
├── lib.rs            # Library entry point
└── main.rs           # Application entry point
```

### Testing Guidelines

1. **Unit Tests**
   - Test individual functions and components
   - Mock external dependencies
   - Aim for high test coverage

2. **Integration Tests**
   - Test Tauri command integration
   - Verify state management flows
   - Test error handling

3. **E2E Tests**
   - Test critical user workflows
   - Verify cross-platform functionality
   - Test streaming integrations

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly feature releases
- **Major releases**: Quarterly or as needed for breaking changes

## Community and Support

### Getting Help

1. **Documentation**: Check existing docs first
2. **Issues**: Search existing issues before creating new ones
3. **Discussions**: Use GitHub Discussions for questions
4. **Discord**: Join our development Discord for real-time chat

### Reporting Issues

When reporting bugs, include:

1. **Environment Information**
   - Operating system and version
   - StreamSlate version
   - Node.js and Rust versions

2. **Reproduction Steps**
   - Clear, step-by-step instructions
   - Expected vs actual behavior
   - Screenshots or recordings if helpful

3. **Additional Context**
   - Error messages or logs
   - PDF files that cause issues (if safe to share)
   - Configuration settings

### Feature Requests

For new features:

1. **Check Existing Requests**
   - Search issues and discussions
   - Avoid duplicating requests

2. **Provide Context**
   - Describe the use case
   - Explain why it's valuable
   - Suggest implementation approaches

3. **Consider Scope**
   - Align with project goals
   - Consider maintenance burden
   - Think about user experience

## License

By contributing to StreamSlate, you agree that your contributions will be licensed under the same terms as the project:

- **GPL-3.0**: For open source use
- **Commercial License**: Available for commercial applications

All contributions must include appropriate license headers and cannot contain code with incompatible licenses.

## Recognition

Contributors are recognized in:

- **CHANGELOG.md**: For significant contributions
- **README.md**: Top contributors section
- **GitHub**: Contributor graphs and statistics
- **Releases**: Contributor mentions in release notes

## Questions?

If you have questions about contributing:

1. Check this document and related documentation
2. Search existing issues and discussions
3. Create a new discussion for general questions
4. Join our Discord for real-time help

Thank you for contributing to StreamSlate! 🎉
