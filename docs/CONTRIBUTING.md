# Contributing to ImoAgent

Thank you for your interest in contributing to ImoAgent! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check existing issues and discussions
2. Create a feature request with:
   - Clear use case
   - Expected behavior
   - Mockups if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass (`npm test`)
6. Ensure build succeeds (`npm run build`)
7. Commit with clear messages
8. Push to your fork
9. Create a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/imoagent.git
cd imoagent

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

### Commit Messages

Follow conventional commits:

- `feat: add new feature`
- `fix: fix bug in component`
- `docs: update documentation`
- `style: format code`
- `refactor: refactor component`
- `test: add tests`
- `chore: update dependencies`

### Testing

- Write unit tests for utilities
- Write integration tests for components
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Documentation

- Update README.md if adding features
- Update API.md for API changes
- Add JSDoc comments for public APIs
- Include code examples

## Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Third-party integrations
├── types/            # TypeScript types
├── utils/            # Utility functions
└── hooks/            # Custom React hooks
```

## Questions?

Feel free to ask in:
- GitHub Discussions
- Discord server
- Email: support@imoagent.com

Thank you for contributing!
