# CCA MCP Server - Quick Start Guide

Get up and running with CCA MCP Server in 5 minutes.

## Installation

```bash
cd /Users/bretbouchard/apps/schill/confucius/packages/cca-mcp-server
npm install
npm run build
```

## Configuration

### Option 1: Claude Desktop (Recommended)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cca": {
      "command": "node",
      "args": ["/Users/bretbouchard/apps/schill/confucius/packages/cca-mcp-server/dist/index.js"],
      "env": {
        "CONFUCIUS_REPO": "/Users/bretbouchard/apps/schill/white_room",
        "CONFUCIUS_SUBMODULES": "sdk,juce_backend,swift_frontend,daw_control,design_system,infrastructure"
      }
    }
  }
}
```

Restart Claude Desktop.

### Option 2: MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx -y @confucius-ai/cca-mcp-server
```

## Basic Usage

### 1. Store Information

When you learn something useful:

```
Store this in Confucius:
Scope: task
Type: pattern
Content: When fixing SwiftUI preview crashes, always check for missing @State bindings
Tags: swiftui, debugging, ios
```

### 2. Retrieve Context

Before starting work:

```
Check Confucius for patterns about:
"JUCE build errors CMake compilation"
```

### 3. Create Task Scope

When starting a new task:

```
Create Confucius task scope for white_room-319:
Title: Create CCA MCP Server
Description: Implement MCP server for Confucius
```

## Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `memory_store` | Save artifacts | After learning something new |
| `memory_retrieve` | Get relevant context | Before starting work |
| `memory_create_task` | Create task scope | When starting new task |
| `memory_stats` | Get statistics | Check memory usage |
| `memory_clear` | Clear all memories | Testing only (destructive) |
| `memory_search_scopes` | Search specific scope | Targeted search |

## Memory Scopes

- **Repository** (10%): Project-wide patterns
- **Submodule** (30%): Component-specific knowledge
- **Session** (30%): Current conversation
- **Task** (30%): Task-specific learnings

## Best Practices

✅ **DO:**
- Store reusable patterns and solutions
- Retrieve context before starting work
- Use appropriate scopes for each artifact
- Add tags for better retrieval

❌ **DON'T:**
- Store temporary calculations
- Use repository scope for task-specific items
- Forget to add metadata (tags, confidence)
- Clear memory without backup

## Common Workflows

### Workflow 1: Fix a Bug

```
1. Check Confucius: "Retrieve patterns about [bug type]"
2. Use past solutions to fix bug
3. Store fix: "Save pattern about how I fixed this"
```

### Workflow 2: Start New Task

```
1. Create task scope: "Create scope for [task-id]"
2. Confucius auto-injects relevant context
3. Work with full context available
4. Store learnings as you go
```

### Workflow 3: Make Design Decision

```
1. Retrieve: "Get context about [domain]"
2. Make decision based on past patterns
3. Store: "Save design decision with rationale"
```

## Troubleshooting

**Server not starting?**
```bash
cd /Users/bretbouchard/apps/schill/confucius/packages/memory && npm run build
```

**Tools not showing?**
- Check Claude Desktop logs
- Verify MCP configuration syntax
- Restart Claude Desktop

**Memory not saving?**
- Check CONFUCIUS_REPO environment variable
- Verify write permissions to .beads/memory/

## Next Steps

1. ✅ Install and configure
2. ✅ Test with MCP Inspector
3. ✅ Add to Claude Desktop
4. ✅ Start storing and retrieving context
5. ✅ Build your team's knowledge base

## Need Help?

- Full documentation: `README.md`
- Implementation details: `IMPLEMENTATION_REPORT.md`
- Usage examples: `examples/usage.ts`
- Issues: GitHub Issues

---

**Happy learning with Confucius!** 🧠✨
