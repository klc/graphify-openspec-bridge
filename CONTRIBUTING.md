# Contributing

## Development Setup

```bash
git clone <repo-url>
cd graphify-openspec-bridge
npm link   # makes `gob` available globally
```

## Running Tests

```bash
# Manual smoke tests
node bin/graphify-openspec-bridge.js help
node bin/graphify-openspec-bridge.js version
node bin/graphify-openspec-bridge.js check .

# Schema validation
openspec schema validate graphify-augmented
```

## Pull Request Process

1. Update CHANGELOG.md with your changes
2. Test all CLI commands
3. Validate the schema
4. Bump version in package.json if needed

## Code Style

- Zero external dependencies in the CLI
- Use `const`/`let`, arrow functions
- Error messages should be actionable (tell user what to do)
- Cross-platform: test `which` vs `where` logic
