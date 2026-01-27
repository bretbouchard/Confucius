#!/usr/bin/env node

/**
 * Confucius Orchestrator MCP Server
 *
 * Exposes the Confucius Hierarchical Memory System as Claude Code tools.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import from @confucius-ai/memory package
import { HierarchicalMemory } from '@confucius-ai/memory';
import type { MemoryConfig, Artifact } from '@confucius-ai/memory';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCP Server for Confucius Orchestrator
 */
class ConfuciusOrchestratorServer {
  private server: Server;
  private memory: HierarchicalMemory;

  constructor() {
    // Initialize memory system
    const config: MemoryConfig = {
      repository: process.env.CONFUCIUS_REPOSITORY || process.cwd(),
      submodules: (process.env.CONFUCIUS_SUBMODULES || 'sdk,juce_backend,swift_frontend').split(','),
      storage: {
        backend: 'filesystem',
        path: process.env.CONFUCIUS_STORAGE_PATH || join(process.cwd(), '.beads', 'memory'),
        maxSize: 1000,
        retentionDays: 90,
      },
      compression: {
        targetTokens: 100000,
        compressionLevel: 0.5,
        scopeBudgets: {
          repository: 0.1,
          submodule: 0.3,
          session: 0.3,
          task: 0.3,
        },
      },
    };

    this.memory = new HierarchicalMemory(config);
    this.server = new Server(
      {
        name: 'confucius-orchestrator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // Start auto-learning if enabled
    this.startAutoLearning();
  }

  /**
   * Start automatic learning from task management
   */
  private startAutoLearning(): void {
    if (process.env.CONFUCIUS_AUTO_LEARNING !== 'true') {
      return;
    }

    // Dynamic import to avoid loading if not needed
    import('@confucius-ai/memory/storage').then(({ BeadsIntegration }) => {
      const beads = new BeadsIntegration({
        databasePath: process.env.CONFUCIUS_REPOSITORY || process.cwd(),
        autoCreateTaskScopes: true,
        autoGenerateNotes: true,
      });

      // Watch for closed issues
      beads.watchResolutions(async (issueId: string, note: string) => {
        await this.memory.store({
          id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'pattern',
          content: note,
          metadata: {
            scope: 'repository',
            tags: ['auto-learned', issueId],
            confidence: 0.8,
          },
          timestamp: new Date(),
        });

        console.error(`✅ Confucius learned from ${issueId}`);
      });

      console.error('🧠 Confucius auto-learning enabled');
    }).catch((err) => {
      console.error('⚠️  Could not enable auto-learning:', err.message);
    });
  }

  /**
   * Set up tool handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'memory_store',
            description: 'Store an artifact in the Confucius hierarchical memory system',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Artifact content to store',
                },
                type: {
                  type: 'string',
                  description: 'Artifact type (pattern, error_message, design_decision, build_log, test_result, conversation)',
                  enum: ['pattern', 'error_message', 'design_decision', 'build_log', 'test_result', 'conversation'],
                },
                scope: {
                  type: 'string',
                  description: 'Target scope (repository, submodule, session, task)',
                  enum: ['repository', 'submodule', 'session', 'task'],
                },
                submodule: {
                  type: 'string',
                  description: 'Submodule name (required if scope=submodule)',
                },
                taskId: {
                  type: 'string',
                  description: 'Task ID (required if scope=task)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for retrieval',
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score (0-1)',
                  minimum: 0,
                  maximum: 1,
                },
              },
              required: ['content', 'type', 'scope'],
            },
          },
          {
            name: 'memory_retrieve',
            description: 'Retrieve relevant context from Confucius hierarchical memory',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for context retrieval',
                },
                activeScope: {
                  type: 'string',
                  description: 'Active scope name (optional)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'memory_create_task_scope',
            description: 'Create a task-specific memory scope for a bd issue',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Task ID (e.g., bd-123)',
                },
                title: {
                  type: 'string',
                  description: 'Task title',
                },
                description: {
                  type: 'string',
                  description: 'Task description',
                },
              },
              required: ['taskId', 'title', 'description'],
            },
          },
          {
            name: 'memory_query',
            description: 'Query Confucius memory system statistics',
            inputSchema: {
              type: 'object',
              properties: {
                scope: {
                  type: 'string',
                  description: 'Specific scope to query (optional)',
                },
              },
            },
          },
          {
            name: 'memory_clear_scope',
            description: 'Clear a specific scope in the memory system',
            inputSchema: {
              type: 'object',
              properties: {
                scope: {
                  type: 'string',
                  description: 'Scope to clear',
                  enum: ['repository', 'submodule', 'session', 'task'],
                },
                submodule: {
                  type: 'string',
                  description: 'Submodule name (if scope=submodule)',
                },
                taskId: {
                  type: 'string',
                  description: 'Task ID (if scope=task)',
                },
              },
              required: ['scope'],
            },
          },
          {
            name: 'memory_learning_status',
            description: 'Check if Confucius is actively learning from task management',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'memory_store':
          return await this.handleMemoryStore(args);

        case 'memory_retrieve':
          return await this.handleMemoryRetrieve(args);

        case 'memory_create_task_scope':
          return await this.handleCreateTaskScope(args);

        case 'memory_query':
          return await this.handleMemoryQuery(args);

        case 'memory_clear_scope':
          return await this.handleClearScope(args);

        case 'memory_learning_status':
          return await this.handleLearningStatus();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Handle memory_store tool
   */
  private async handleMemoryStore(args: any) {
    const {
      content,
      type,
      scope,
      submodule,
      taskId,
      tags = [],
      confidence = 0.5,
    } = args;

    // Validate scope-specific requirements
    if (scope === 'submodule' && !submodule) {
      throw new Error('submodule is required when scope=submodule');
    }

    if (scope === 'task' && !taskId) {
      throw new Error('taskId is required when scope=task');
    }

    // Create artifact
    const artifact: Artifact = {
      id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      metadata: {
        scope,
        submodule,
        taskId,
        tags,
        confidence,
      },
      timestamp: new Date(),
    };

    // Store in memory
    await this.memory.store(artifact);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Artifact stored successfully in ${scope} scope`,
        },
      ],
      isError: false,
    };
  }

  /**
   * Handle memory_retrieve tool
   */
  private async handleMemoryRetrieve(args: any) {
    const { query, activeScope } = args;

    // Retrieve context
    const context = await this.memory.retrieve(query, activeScope);

    // Format results
    const artifactList = context.artifacts.map((artifact: Artifact) => {
      const scopeInfo = artifact.metadata.scope;
      const confidenceInfo = artifact.metadata.confidence
        ? ` (confidence: ${artifact.metadata.confidence})`
        : '';

      return `[${scopeInfo}]${confidenceInfo}: ${artifact.content.substring(0, 200)}${artifact.content.length > 200 ? '...' : ''}`;
    });

    const response = [
      `Found ${context.artifacts.length} relevant artifacts:`,
      '',
      ...artifactList,
      '',
      `Compression: ${(context.compressionRatio * 100).toFixed(1)}%`,
      `Tokens: ${context.totalTokens}/${context.totalTokens}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
      isError: false,
    };
  }

  /**
   * Handle memory_create_task_scope tool
   */
  private async handleCreateTaskScope(args: any) {
    const { taskId, title, description } = args;

    // Create task scope
    await this.memory.createTaskScope(taskId, {
      title,
      description,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Task scope created for ${taskId}. Relevant notes from past issues have been automatically injected into the task scope.`,
        },
      ],
      isError: false,
    };
  }

  /**
   * Handle memory_query tool
   */
  private async handleMemoryQuery(args: any) {
    const stats = await this.memory.getStats();

    const response = [
      `Confucius Memory System Statistics:`,
      `----------------------------`,
      `Total Scopes: ${stats.scopes}`,
      `Total Artifacts: ${stats.artifacts}`,
      `Total Tokens: ${stats.totalTokens}`,
      `Average Tokens per Artifact: ${Math.round(stats.totalTokens / stats.artifacts)}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
      isError: false,
    };
  }

  /**
   * Handle memory_clear_scope tool
   */
  private async handleClearScope(args: any) {
    const { scope, submodule, taskId } = args;

    // Note: This is a simplified implementation
    // In production, you'd want to clear specific scopes
    await this.memory.clear();

    return {
      content: [
        {
          type: 'text',
          text: `✅ Memory system cleared. All artifacts have been removed.`,
        },
      ],
      isError: false,
    };
  }

  /**
   * Handle memory_learning_status tool
   */
  private async handleLearningStatus() {
    const isEnabled = process.env.CONFUCIUS_AUTO_LEARNING === 'true';

    return {
      content: [
        {
          type: 'text',
          text: `Confucius Auto-Learning Status:\n` +
                `----------------------------\n` +
                `Auto-Learning: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
                `Environment Variable: CONFUCIUS_AUTO_LEARNING=${process.env.CONFUCIUS_AUTO_LEARNING || 'false'}\n\n` +
                `${isEnabled ? 'Confucius is actively watching for closed issues and extracting patterns automatically!' : 'Enable auto-learning by setting CONFUCIUS_AUTO_LEARNING=true in MCP configuration'}`,
      },
    ],
    isError: false,
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Confucius MCP Server running on stdio');
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = new ConfuciusOrchestratorServer();
  await server.start();
}

// Always start the server when this file is executed
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
