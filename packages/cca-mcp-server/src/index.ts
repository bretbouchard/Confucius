#!/usr/bin/env node

/**
 * CCA MCP Server
 *
 * Confucius Context Agent MCP Server - Provides tools for interacting with
 * the hierarchical memory system through the Model Context Protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { HierarchicalMemory, Artifact } from '@confucius-ai/memory';
import type { MemoryConfig, ScopeType, ArtifactType } from '@confucius-ai/memory';

// Get configuration from environment
const CONFUCIUS_REPO = process.env.CONFUCIUS_REPO || process.cwd();
const CONFUCIUS_SUBMODULES = process.env.CONFUCIUS_SUBMODULES?.split(',') || [
  'sdk',
  'juce_backend',
  'swift_frontend',
  'daw_control',
  'design_system',
  'infrastructure',
];

// Initialize memory system
const memoryConfig: MemoryConfig = {
  repository: CONFUCIUS_REPO,
  submodules: CONFUCIUS_SUBMODULES,
  storage: {
    backend: 'filesystem',
    path: `${CONFUCIUS_REPO}/.beads/memory`,
  },
  compression: {
    targetTokens: 8000,
    compressionLevel: 0.7,
    scopeBudgets: {
      repository: 800,
      submodule: 2400,
      session: 2400,
      task: 2400,
    },
  },
};

const memory = new HierarchicalMemory(memoryConfig);

// Initialize memory system
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await memory.initialize();
    initialized = true;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'cca-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'memory_store',
    description: 'Store information in Confucius hierarchical memory system. Use this to save patterns, learnings, error messages, design decisions, or any other artifacts that should be remembered for future reference.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['repository', 'submodule', 'session', 'task'],
          description: 'Memory scope level. Repository (10%) for project-wide patterns, Submodule (30%) for component-specific, Session (30%) for current conversation, Task (30%) for task-specific learnings.',
        },
        artifactType: {
          type: 'string',
          enum: ['code_diff', 'error_message', 'design_decision', 'build_log', 'test_result', 'conversation', 'pattern'],
          description: 'Type of artifact being stored',
        },
        content: {
          type: 'string',
          description: 'Content to store in memory',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata including submodule, taskId, file, language, tags, confidence, and related artifacts',
          properties: {
            submodule: {
              type: 'string',
              description: 'Submodule name (if scope is submodule)',
            },
            taskId: {
              type: 'string',
              description: 'Task ID (if scope is task)',
            },
            file: {
              type: 'string',
              description: 'File path (if applicable)',
            },
            language: {
              type: 'string',
              description: 'Programming language or technology',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for retrieval',
            },
            confidence: {
              type: 'number',
              description: 'Confidence score (0-1) for learned patterns',
            },
            related: {
              type: 'array',
              items: { type: 'string' },
              description: 'Related artifact IDs',
            },
          },
        },
      },
      required: ['scope', 'artifactType', 'content'],
    },
  },
  {
    name: 'memory_retrieve',
    description: 'Retrieve relevant memories from Confucius based on a query. This searches across all artifacts and returns the most relevant ones based on semantic similarity.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query describing what you are looking for',
        },
        activeScope: {
          type: 'string',
          enum: ['repository', 'submodule', 'session', 'task'],
          description: 'Active scope to prioritize in results (optional)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory_create_task',
    description: 'Create a new task scope for a specific issue or task. This automatically injects relevant context from higher scopes into the new task scope.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Unique task identifier (e.g., issue number or ticket ID)',
        },
        taskContext: {
          type: 'object',
          description: 'Task context including title, description, labels, etc.',
        },
      },
      required: ['taskId', 'taskContext'],
    },
  },
  {
    name: 'memory_stats',
    description: 'Get statistics about memory usage including number of scopes, artifacts, and total tokens stored.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'memory_clear',
    description: 'Clear all memories from all scopes. WARNING: This is destructive and cannot be undone! Use with extreme caution, typically only for testing.',
    inputSchema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['confirm'],
    },
  },
  {
    name: 'memory_search_scopes',
    description: 'Search for artifacts within a specific scope. Use this when you want to limit your search to a particular scope level.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        scope: {
          type: 'string',
          enum: ['repository', 'submodule', 'session', 'task'],
          description: 'Scope to search within',
        },
      },
      required: ['query', 'scope'],
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    await ensureInitialized();

    switch (name) {
      case 'memory_store': {
        const { scope, artifactType, content, metadata = {} } = args as {
          scope: ScopeType;
          artifactType: ArtifactType;
          content: string;
          metadata?: any;
        };

        const artifact: Artifact = {
          id: `${scope}-${artifactType}-${Date.now()}`,
          type: artifactType,
          content,
          metadata: {
            ...metadata,
            scope,
          },
          timestamp: new Date(),
        };

        await memory.store(artifact);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Successfully stored ${artifactType} artifact in ${scope} scope`,
                  artifactId: artifact.id,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'memory_retrieve': {
        const { query, activeScope } = args as {
          query: string;
          activeScope?: ScopeType;
        };

        const context = await memory.retrieve(query, activeScope);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  activeScope: activeScope || 'all',
                  results: {
                    artifacts: context.artifacts,
                    stats: {
                      totalArtifacts: context.artifacts.length,
                      compressionRatio: context.compressionRatio,
                      totalTokens: context.totalTokens,
                      scopeBreakdown: context.scopes,
                    },
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'memory_create_task': {
        const { taskId, taskContext } = args as {
          taskId: string;
          taskContext: any;
        };

        await memory.createTaskScope(taskId, taskContext);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: `Created task scope for ${taskId} with relevant context injected`,
                  taskId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'memory_stats': {
        const stats = await memory.getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  stats: {
                    scopes: stats.scopes,
                    artifacts: stats.artifacts,
                    totalTokens: stats.totalTokens,
                    config: {
                      repository: memoryConfig.repository,
                      submodules: memoryConfig.submodules,
                    },
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'memory_clear': {
        const { confirm } = args as { confirm: boolean };

        if (!confirm) {
          throw new Error('Must confirm deletion by setting confirm=true');
        }

        await memory.clear();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Cleared all memories from all scopes',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'memory_search_scopes': {
        const { query, scope } = args as {
          query: string;
          scope: ScopeType;
        };

        // For now, we'll use retrieve with the scope as activeScope
        // In the future, we might want to add a more specific search method
        const context = await memory.retrieve(query, scope);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  scope,
                  results: {
                    artifacts: context.artifacts,
                    stats: {
                      totalArtifacts: context.artifacts.length,
                      totalTokens: context.totalTokens,
                    },
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : String(error),
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  // Initialize memory system
  await ensureInitialized();

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP communication
  console.error('CCA MCP Server running on stdio');
  console.error(`Repository: ${memoryConfig.repository}`);
  console.error(`Submodules: ${memoryConfig.submodules.join(', ')}`);
  console.error(`Memory path: ${memoryConfig.storage?.path}`);
}

main().catch((error) => {
  console.error('Failed to start CCA MCP Server:', error);
  process.exit(1);
});
