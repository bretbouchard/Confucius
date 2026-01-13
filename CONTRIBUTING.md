# Contributing to Confucius

Thank you for your interest in contributing to Confucius! We appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment.

## How Can I Contribute?

### Report Bugs

Create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)

### Suggest Features

Start a discussion or create an issue with:
- Use case description
- Proposed implementation
- Alternatives considered

### Submit Code

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/confucius.git
cd confucius

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Run linting
npm run lint
```

## Pull Request Process

1. **Update Documentation** - Keep docs in sync with code changes
2. **Add Tests** - Ensure new features have test coverage
3. **Follow Standards** - Adhere to coding standards (see below)
4. **Commit Messages** - Use clear, descriptive commit messages
5. **PR Description** - Explain what and why, not just how

### PR Template

```markdown
## Description
Brief description of changes

## Type
- [ ] Bug fix
- [ ] Feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Coding Standards

### TypeScript

- Use TypeScript for all source code
- Enable strict mode in tsconfig.json
- Avoid `any` types
- Use interfaces for public APIs
- Add JSDoc comments for exports

### Testing

- Write tests for all new features
- Aim for >80% code coverage
- Use Vitest for unit tests
- Mock external dependencies

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Max line length: 100 characters
- Use meaningful variable names

### Git Commit Messages

```
type(scope): description

feat(memory): add deduplication for similar artifacts
fix(compression): handle empty artifact lists
docs(readme): update installation instructions
```

Types: feat, fix, docs, style, refactor, test, chore

## Project Structure

```
confucius/
├── packages/
│   ├── memory/           # Core memory system
│   └── mcp-server/       # MCP server for Claude Code
├── docs/                 # Documentation
├── examples/             # Usage examples
└── tests/                # Integration tests
```

## Questions?

Feel free to open an issue for clarification.

---

Thank you for contributing to Confucius! 🙏
