# Contributing to IVAkit

First off, thank you for considering contributing to IVAkit! It's people like you that make IVAkit such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Submit the pull request!

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Bun (for API server)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ivakit.git
cd ivakit

# Add upstream remote
git remote add upstream https://github.com/ivakit/ivakit.git

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development
pnpm dev
```

### Project Structure

```
ivakit/
├── apps/
│   ├── studio/          # Next.js frontend
│   └── api/             # Hono API server
├── packages/
│   ├── shared/          # Shared types, schemas, utils
│   ├── database/        # Database schema and migrations
│   ├── runtime/         # Flow execution engine
│   └── ai/              # AI/LLM adapters
└── docs/                # Documentation
```

### Commands

```bash
pnpm dev              # Start all apps
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm typecheck        # Type check
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React

- Use functional components with hooks
- Keep components small and focused
- Use the `cn()` utility for conditional classes
- Follow shadcn/ui patterns

### Validation

- Use Zod for runtime validation
- Define schemas in `@ivakit/shared`
- Validate all external input

### Commits

We follow conventional commits:

```
feat: Add new knowledge base search node
fix: Correct edge connection validation
docs: Update flow spec documentation
refactor: Simplify condition evaluation logic
test: Add unit tests for runtime engine
```

## Testing

### Unit Tests

```bash
pnpm test
```

Tests should:
- Be independent and isolated
- Test one thing at a time
- Have descriptive names
- Cover edge cases

### E2E Tests

```bash
pnpm test:e2e
```

## Documentation

When adding features:
- Update relevant docs in `/docs`
- Add JSDoc comments to code
- Update README if needed
- Include examples

## Review Process

1. All changes require a pull request
2. At least one approval is required
3. CI must pass (tests, lint, build)
4. Changes should be squash-merged

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to IVAkit! 🎉
