# AGENTS.md — graphify-openspec-bridge

AI assistant rules for working on this project.

## Context

This project provides a community OpenSpec schema (`graphify-augmented`) and a CLI tool for installing and managing it. It bridges OpenSpec (workflow orchestration) with Graphify (knowledge graph).

## Key Files

| File | Purpose |
|------|---------|
| `openspec/schemas/graphify-augmented/schema.yaml` | Schema definition (5 artifacts) |
| `openspec/schemas/graphify-augmented/templates/` | Artifact templates (proposal, explore, spec, design, tasks) |
| `bin/graphify-openspec-bridge.js` | CLI entry point (Node.js, zero deps) |
| `package.json` | npm package metadata |

## Project Rules

- **Zero external dependencies** — CLI uses only Node.js built-in modules (`fs`, `path`, `child_process`)
- **Cross-platform** — use `which` (Unix) / `where` (Windows) for tool detection via `os.platform()`
- **Schema changes** — schema.yaml changes MUST be validated with `openspec schema validate graphify-augmented`
- **Backwards compatibility** — CLI commands and flags must not break existing installs
- **npm packaging** — `"files"` in package.json must include `bin/` and `openspec/`
- **Dual binary** — `graphify-openspec-bridge` and `gob` aliases in package.json
