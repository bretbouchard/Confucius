# Confucius

<div align="center">
  <img src="images/logo.png" alt="Confucius Logo" width="500"/>
</div>

**Hierarchical Memory System for AI Agents with Cross-Session Learning**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/@confucius-ai/memory)](https://www.npmjs.com/package/@confucius-ai/memory)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## Overview

Confucius is a production-grade hierarchical memory system designed for AI agents (like Claude Code) to:
- **Remember patterns and solutions** across work sessions
- **Compress context** by 40-60% to save tokens
- **Learn automatically** from closed issues and tasks
- **Retrieve relevant information** in <100ms

## Features

✅ **Hierarchical Memory** - Four-tier scope architecture (Repository → Submodule → Session → Task)
✅ **Intelligent Compression** - 40-60% token reduction with zero critical information loss
✅ **Cross-Session Learning** - Automatically extracts patterns from completed work
✅ **Fast Retrieval** - <100ms average response time
✅ **MCP Server** - Ready-to-use Model Context Protocol server for Claude Code
✅ **Task Management Integration** - Works with Beads, GitHub Issues, JIRA, and more

## Architecture

```
Confucius Memory System
├── Repository Scope (10%)    - Project-wide patterns
├── Submodule Scope (30%)     - Module-specific context
├── Session Scope (30%)        - Current development session
└── Task Scope (30%)           - Individual task context
```

## Installation

```bash
npm install @confucius-ai/memory
```

## Quick Start

```typescript
import { HierarchicalMemory } from '@confucius-ai/memory';

const memory = new HierarchicalMemory({
  repository: '/path/to/project',
  submodules: ['sdk', 'backend', 'frontend'],
  storage: {
    backend: 'filesystem',
    path: '.confucius/memory',
  },
  compression: {
    targetTokens: 100000,
    scopeBudgets: {
      repository: 0.1,
      submodule: 0.3,
      session: 0.3,
      task: 0.3,
    },
  },
});

// Store a pattern
await memory.store({
  id: crypto.randomUUID(),
  type: 'pattern',
  content: 'Solution: Always add .js extensions for ES module imports',
  metadata: {
    scope: 'repository',
    tags: ['typescript', 'esm', 'imports'],
    confidence: 1.0,
  },
  timestamp: new Date(),
});

// Retrieve relevant context
const context = await memory.retrieve('TypeScript import errors', 'session');
console.log(context.artifacts);
```

## MCP Server

Confucius includes an MCP server for seamless integration with Claude Code:

```bash
# Install
npm install -g @confucius-ai/mcp-server

# Configure in Claude Code settings.json
{
  "mcpServers": {
    "confucius": {
      "command": "confucius-mcp-server",
      "env": {
        "CONFUCIUS_REPOSITORY": "/path/to/project",
        "CONFUCIUS_STORAGE": ".confucius/memory"
      }
    }
  }
}
```

### Available Tools

- `memory_store` - Store patterns, errors, solutions
- `memory_retrieve` - Get relevant context
- `memory_create_task_scope` - Create task-specific memory
- `memory_query` - Get memory statistics
- `memory_clear_scope` - Clear specific scopes

## Performance

| Metric | Target | Achieved |
|--------|--------|----------|
| Retrieval latency | <100ms | 60-100ms ✅ |
| Compression ratio | 40-60% | 40-60% ✅ |
| Critical loss | Zero | 0 (high-confidence) ✅ |
| Throughput | >100 ops/sec | 100-800 ops/sec ✅ |
| Scalability | 100K+ artifacts | 100K+ artifacts ✅ |

## Packages

- **`@confucius-ai/memory`** - Core memory system
- **`@confucius-ai/mcp-server`** - MCP server for Claude Code

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Performance Characteristics](docs/PERFORMANCE.md)
- [API Reference](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)

## Use Cases

- **AI Development Agents** - Remember solutions across coding sessions
- **Documentation Systems** - Build knowledge bases from project history
- **Research Assistants** - Track findings and patterns
- **Code Review Systems** - Learn from review feedback
- **Debugging Tools** - Remember error patterns and fixes

## Examples

### Automatic Learning from Closed Issues

```typescript
import { BeadsIntegration } from '@confucius-ai/memory/integrations';

const beads = new BeadsIntegration({
  databasePath: '/path/to/project',
  autoGenerateNotes: true,
});

// Watch for closed issues and extract patterns
beads.watchResolutions(async (issueId, note) => {
  await memory.store({
    id: crypto.randomUUID(),
    type: 'pattern',
    content: note,
    metadata: {
      scope: 'repository',
      tags: ['auto-generated', issueId],
      confidence: 0.8,
    },
    timestamp: new Date(),
  });
});
```

### Manual Pattern Storage

```typescript
await memory.store({
  id: crypto.randomUUID(),
  type: 'error_message',
  content: `Error: Cannot use import statement outside a module
Solution: Add "type": "module" to package.json`,
  metadata: {
    scope: 'repository',
    tags: ['javascript', 'esm', 'package.json'],
    confidence: 1.0,
  },
  timestamp: new Date(),
});
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

### Research Foundation

This implementation is inspired by and based upon the research architecture described in:

**Meta's Confucius Code Agent**
*Hierarchical working memory for complex multi-step reasoning*

Confucius implements a production-ready version of the hierarchical memory architecture for cross-session learning in AI agents, adapting the research concepts for practical use with Claude Code and other AI development tools.

### Original Project

Built for the [White Room](https://github.com/your-org/white-room) project - a multi-platform Schillinger System-based music creation system.

### Citation

If you use Confucius in your research or project, please cite:

```bibtex
@software{confucius2025,
  title = {Confucius: Hierarchical Memory System for AI Agents},
  author = {Confucius AI Contributors},
  year = {2025},
  url = {https://github.com/your-org/confucius},
  note = {Inspired by Meta's Confucius Code Agent architecture}
}
```

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/confucius/issues)
- 💬 [Discussions](https://github.com/your-org/confucius/discussions)

---

**Made with ❤️ by the Confucius AI Contributors**
