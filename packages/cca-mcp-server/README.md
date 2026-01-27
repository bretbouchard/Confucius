# CCA MCP Server

**Confucius Context Agent MCP Server** - Provides tools for interacting with the hierarchical memory system through the Model Context Protocol.

## Overview

CCA (Confucius Context Agent) is an MCP server that exposes the Confucius hierarchical memory system as tools for AI agents. It enables intelligent context management across multiple scopes (repository, submodule, session, task) with automatic compression and intelligent retrieval.

## Features

- **Hierarchical Memory Management**: Store and retrieve context across 4 scopes
- **Semantic Search**: Find relevant artifacts using natural language queries
- **Automatic Compression**: Intelligent context compression to stay within token budgets
- **Task Scope Creation**: Auto-inject relevant context when creating task scopes
- **Statistics & Monitoring**: Track memory usage and artifact counts
- **MCP Protocol**: Standard Model Context Protocol for easy integration

## Installation

### From npm (when published)

```bash
npm install -g @confucius-ai/cca-mcp-server
```

### From source

```bash
cd /Users/bretbouchard/apps/schill/confucius/packages/cca-mcp-server
npm install
npm run build
npm link
```

## Configuration

### Environment Variables

- `CONFUCIUS_REPO` - Path to repository root (default: current directory)
- `CONFUCIUS_SUBMODULES` - Comma-separated list of submodules (default: sdk,juce_backend,swift_frontend,daw_control,design_system,infrastructure)

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "cca": {
      "command": "cca-mcp-server",
      "env": {
        "CONFUCIUS_REPO": "/Users/bretbouchard/apps/schill/white_room",
        "CONFUCIUS_SUBMODULES": "sdk,juce_backend,swift_frontend,daw_control,design_system,infrastructure"
      }
    }
  }
}
```

### With MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx -y @confucius-ai/cca-mcp-server
```

## Available Tools

### 1. `memory_store`

Store information in Confucius hierarchical memory system.

**Parameters:**
- `scope` (required): Memory scope level
  - `repository` - Project-wide patterns (10% budget)
  - `submodule` - Component-specific (30% budget)
  - `session` - Current conversation (30% budget)
  - `task` - Task-specific learnings (30% budget)
- `artifactType` (required): Type of artifact
  - `code_diff` - Code changes
  - `error_message` - Errors and exceptions
  - `design_decision` - Architectural decisions
  - `build_log` - Build-related learnings
  - `test_result` - Testing insights
  - `conversation` - Important discussions
  - `pattern` - Reusable solutions
- `content` (required): Content to store
- `metadata` (optional): Additional metadata
  - `submodule` - Submodule name
  - `taskId` - Task ID
  - `file` - File path
  - `language` - Programming language
  - `tags` - Tags for retrieval
  - `confidence` - Confidence score (0-1)
  - `related` - Related artifact IDs

**Example:**
```json
{
  "scope": "task",
  "artifactType": "pattern",
  "content": "When fixing SwiftUI preview crashes, always check for missing @State bindings and ensure View conforms to Identifiable",
  "metadata": {
    "tags": ["swiftui", "preview", "debugging"],
    "confidence": 0.9,
    "taskId": "white_room-123"
  }
}
```

### 2. `memory_retrieve`

Retrieve relevant memories based on a query.

**Parameters:**
- `query` (required): Search query
- `activeScope` (optional): Active scope to prioritize

**Returns:**
- `artifacts`: Array of relevant artifacts
- `stats`: Statistics including compression ratio and token counts

**Example:**
```json
{
  "query": "SwiftUI preview crashes",
  "activeScope": "task"
}
```

### 3. `memory_create_task`

Create a new task scope with auto-injected context.

**Parameters:**
- `taskId` (required): Unique task identifier
- `taskContext` (required): Task context object

**Example:**
```json
{
  "taskId": "white_room-319",
  "taskContext": {
    "title": "Create CCA MCP Server",
    "description": "Implement MCP server for Confucius",
    "labels": ["feature", "mcp"],
    "priority": "high"
  }
}
```

### 4. `memory_stats`

Get statistics about memory usage.

**Returns:**
- `scopes`: Number of scopes
- `artifacts`: Total artifact count
- `totalTokens`: Total tokens stored
- `config`: Configuration details

### 5. `memory_clear`

Clear all memories from all scopes (DESTRUCTIVE).

**Parameters:**
- `confirm` (required): Must be `true` to confirm

**Warning:** This cannot be undone! Use only for testing.

### 6. `memory_search_scopes`

Search for artifacts within a specific scope.

**Parameters:**
- `query` (required): Search query
- `scope` (required): Scope to search within

**Example:**
```json
{
  "query": "TypeScript module resolution",
  "scope": "repository"
}
```

## Usage Examples

### Storing a Pattern

```typescript
// After fixing a SwiftUI preview crash
await mcp.callTool('memory_store', {
  scope: 'task',
  artifactType: 'pattern',
  content: 'When fixing SwiftUI preview crashes, always check for missing @State bindings and ensure View conforms to Identifiable',
  metadata: {
    tags: ['swiftui', 'preview', 'debugging'],
    confidence: 0.9
  }
});
```

### Retrieving Context Before Starting Work

```typescript
// Before starting work on a bug fix
const results = await mcp.callTool('memory_retrieve', {
  query: 'JUCE build errors CMake compilation',
  activeScope: 'repository'
});

// Use retrieved context to avoid repeating past mistakes
console.log(results.artifacts);
```

### Creating a Task Scope

```typescript
// When starting a new task
await mcp.callTool('memory_create_task', {
  taskId: 'white_room-319',
  taskContext: {
    title: 'Create CCA MCP Server',
    description: 'Implement MCP server for Confucius',
    labels: ['feature', 'mcp']
  }
});

// Relevant context from repository and submodule scopes
// is automatically injected into the task scope
```

### Getting Statistics

```typescript
// Check memory usage
const stats = await mcp.callTool('memory_stats', {});
console.log(`Total artifacts: ${stats.artifacts}`);
console.log(`Total tokens: ${stats.totalTokens}`);
```

## Memory Scopes

Confucius organizes memory hierarchically across 4 scopes:

### Repository Scope (10% - ~800 tokens)
- **Purpose**: Project-wide patterns and architectural decisions
- **Examples**: Build configurations, coding standards, architectural patterns
- **Retention**: Permanent across all sessions

### Submodule Scope (30% - ~2400 tokens)
- **Purpose**: Component-specific knowledge
- **Examples**: SDK patterns, JUCE backend issues, SwiftUI best practices
- **Retention**: Shared across all work in that submodule

### Session Scope (30% - ~2400 tokens)
- **Purpose**: Current conversation context
- **Examples**: Ongoing debugging session, current design discussion
- **Retention**: Duration of the session

### Task Scope (30% - ~2400 tokens)
- **Purpose**: Task-specific learnings
- **Examples**: Bug fix patterns, feature implementation notes
- **Retention**: Duration of the task, auto-extracted on bd issue close

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

## Architecture

```
CCA MCP Server
├── MCP Protocol Layer (@modelcontextprotocol/sdk)
├── Tool Handlers (6 tools)
├── HierarchicalMemory Integration (@confucius-ai/memory)
└── Storage Backend (FileSystem)
```

### Components

1. **MCP Server**: Handles MCP protocol communication
2. **Tool Handlers**: Implements 6 tools for memory operations
3. **HierarchicalMemory**: Core memory system
4. **Storage**: File-based storage in `.beads/memory/`

## Error Handling

All tools return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "tool": "tool_name"
}
```

Common errors:
- **Not initialized**: Server not properly initialized
- **Invalid scope**: Scope must be one of: repository, submodule, session, task
- **Invalid artifact type**: Must be a valid artifact type
- **Missing required field**: Check tool schema
- **Storage error**: File system issues

## Best Practices

### When to Store

✅ **DO store:**
- Reusable patterns and solutions
- Error messages and their fixes
- Design decisions and rationale
- Build configuration insights
- Testing strategies
- Important conversation summaries

❌ **DON'T store:**
- Temporary calculations
- One-time data transformations
- Simple syntax questions
- Trivial information

### When to Retrieve

✅ **DO retrieve:**
- Before starting new work
- When encountering errors
- When making design decisions
- When repeating similar work
- When learning about a component

### Scope Selection

- **Repository**: Cross-cutting concerns, architectural decisions
- **Submodule**: Component-specific patterns and issues
- **Session**: Current conversation context
- **Task**: Learnings specific to current task

## Troubleshooting

### Server won't start

```bash
# Check if memory package is built
cd ../memory
npm run build

# Check dependencies
cd ../cca-mcp-server
npm install
```

### Tools not available

```bash
# Verify server is running
# Check Claude Desktop logs
# Verify MCP configuration
```

### Memory not persisting

```bash
# Check CONFUCIUS_REPO environment variable
# Verify write permissions to .beads/memory/
# Check storage backend configuration
```

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Related Packages

- [@confucius-ai/memory](../memory) - Core hierarchical memory system
- [@confucius-ai/cli](../cli) - Command-line interface

## Support

For issues and questions:
- GitHub Issues: [confucius-ai/confucius](https://github.com/confucius-ai/confucius/issues)
- Documentation: [docs.confucius-ai.dev](https://docs.confucius-ai.dev)

## Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [JUCE](https://juce.com/)
- [TypeScript](https://www.typescriptlang.org/)
