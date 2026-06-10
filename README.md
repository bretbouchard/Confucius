# Confucius

<div align="center">
  <img src="images/logo.png" alt="Confucius Logo" width="500"/>
</div>

**Hierarchical Memory System for AI Agents with Cross-Session Learning**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green)](https://python.org)

## What It Does

Confucius gives AI agents persistent, hierarchical memory. Instead of starting every conversation from zero, agents remember patterns, solutions, and failures across sessions.

- **<100ms retrieval** — rg-based text search + semantic MCP retrieval
- **507+ artifacts stored** — patterns, error messages, design decisions, trajectories
- **RnG Framework** — learns from successes (not just failures) for 17-74% better performance on novel tasks
- **Zero critical information loss** — intelligent compression at 40-60% reduction

## Architecture

```
Confucius/
├── packages/
│   ├── mcp-server/       TypeScript — runtime engine (MCP tools for Claude Code)
│   ├── memory/           TypeScript — core memory library (HierarchicalMemory)
│   ├── cca-mcp-server/   TypeScript — alternate MCP server
│   ├── cli/              Python — CLI frontend (store, search, purge, quality gates)
│   └── integration/      Python — cross-project bridge (tier retrieval, Beads ingestion)
├── README.md
└── LICENSE
```

**How the pieces fit together:**

```
TS MCP Server (mcp-server)        Python CLI (cli)
  Runtime engine — Claude          Terminal access — scripts,
  Code calls these tools via       hooks, automation
  MCP protocol
         ↓                              ↓
  HierarchicalMemory              rg-based fast text
  (memory package)                 search + maintenance
         ↓                              ↓
         └──── ~/.confucius/memory/ ────┘
                  Filesystem store
                  (JSON artifacts)
```

The TS and Python packages are complementary. They share the same filesystem store. The MCP server handles real-time agent operations. The CLI handles bulk operations, maintenance, and cross-project piping.

## Installation

```bash
git clone https://github.com/bretbouchard/Confucius.git
cd Confucius
npm install
npm run build
```

## Setup with Claude Code

Add to your `settings.json` MCP servers:

```json
{
  "confucius": {
    "command": "node",
    "args": ["/absolute/path/to/Confucius/packages/mcp-server/dist/index.js"],
    "env": {
      "CONFUCIUS_REPOSITORY": "/path/to/your/project",
      "CONFUCIUS_SUBMODULES": "sdk,backend,frontend",
      "CONFUCIUS_STORAGE_PATH": "/path/to/memory/store",
      "CONFUCIUS_AUTO_LEARNING": "true",
      "CONFUCIUS_PROJECT_NAME": "your-project"
    },
    "description": "Confucius MCP Server - Hierarchical memory with cross-session learning"
  }
}
```

**CLI symlink (optional):**

```bash
ln -sf /absolute/path/to/Confucius/packages/cli/confucius /usr/local/bin/confucius
```

## MCP Tools (TS MCP Server)

These are the tools exposed to Claude Code via MCP:

| Tool | Purpose |
|------|---------|
| `memory_store` | Store artifacts (patterns, errors, decisions, trajectories, knowledge states) |
| `memory_retrieve` | Get relevant context by query |
| `memory_retrieve_successes` | Query ONLY successful trajectories (RnG Framework) |
| `memory_retrodict` | Given a failure, find what knowledge would have prevented it (RnG Framework) |
| `memory_create_task_scope` | Create task-specific memory with context injection |
| `memory_query` | Get memory statistics |
| `memory_clear_scope` | Clear a specific scope |
| `memory_learning_status` | Check if auto-learning is active |
| `memory_ingest_document` | Ingest PDFs, markdown, text into structured artifacts |
| `memory_audit` | Find garbage, duplicates, empty templates |

## CLI Commands (Python)

```bash
confucius store pattern "Use Swift concurrency for async operations" --tags swift,async
confucius search "swift async"
confucius list
confucius get artifact-1234567890
confucius tags
confucius stats
confucius purge-garbage --dry-run
```

| Command | Purpose |
|---------|---------|
| `store` | Store a pattern/solution |
| `search` | Search artifacts (rg-based, fast) |
| `list` | List all stored artifacts |
| `get` | Get full artifact by ID |
| `tags` | List all tags |
| `stats` | Memory statistics (counts by type, scope) |
| `purge-garbage` | Remove garbage artifacts (dedup, quality gates) |

## Integration Layer (Python)

Located in `packages/integration/`. Provides:

- **Tier-aware retrieval** (`confucius_tier_retrieval.py`) — route retrieval to the right memory tier based on query type
- **Cross-project sharing** (`confucius_integration.py`) — pipe patterns between projects, Beads ingestion pipeline
- **store_remember_pattern helper** — one-call pattern storage from hooks and automation

## Memory Scopes

```
Repository (10%)  →  Project-wide patterns, shared across all sessions
Submodule  (30%)  →  Module-specific context (sdk, backend, frontend)
Session    (30%)  →  Current development session
Task       (30%)  →  Individual task context
```

## RnG Framework

RnG (Retrodiction with Generalization) is a learning framework based on [research](https://arxiv.org/abs/2508.03341) showing 17-74% improvement on out-of-distribution tasks.

**Key idea:** Instead of only learning from failures ("I won't do that again"), RnG learns from **successful trajectories** and retrodicts what knowledge would have prevented failures.

```typescript
// When facing a failure, find what successful patterns were missing
const retrodiction = await memory.retrodict({
  failureDescription: 'OAuth2 token validation failing after 2 hours',
  taskContext: 'Implement OAuth2 authentication with PKCE for mobile',
});
// → "Use PKCE for mobile OAuth2 — code verifier prevents interception"
// → "Store token in Keychain, not UserDefaults — prevents data leakage"
```

Based on: [Knowledge-Preenhanced Retrodiction for Out-of-Distribution Generalization in LLM Agents](https://arxiv.org/abs/2508.03341)

## Performance

| Metric | Value |
|--------|-------|
| Retrieval latency | 60-100ms |
| Compression ratio | 40-60% |
| Critical information loss | 0 (high-confidence) |
| Throughput | 100-800 ops/sec |
| OOD improvement (with RnG) | 17-74% |

## Packages

| Package | Language | Purpose |
|---------|----------|---------|
| `@confucius-ai/memory` | TypeScript | Core memory library |
| `@confucius-ai/mcp-server` | TypeScript | MCP server for Claude Code |
| `@confucius-ai/cca-mcp-server` | TypeScript | Alternate MCP server |
| `@confucius-ai/cli` | Python | CLI frontend |
| `@confucius-ai/integration` | Python | Cross-project integration layer |

## License

MIT — see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by [Confucius Code Agent](https://arxiv.org/abs/2512.10398) (Meta & Harvard) — hierarchical working memory for AI software engineers at industrial scale.
