/**
 * HierarchicalMemory - Multi-scope context management system
 */

import { RepositoryScope } from '../scopes/RepositoryScope.js';
import { SubmoduleScope } from '../scopes/SubmoduleScope.js';
import { SessionScope } from '../scopes/SessionScope.js';
import { TaskScope } from '../scopes/TaskScope.js';
import { ContextCompressionEngine } from '../compression/ContextCompressionEngine.js';
import { ArtifactStorage } from '../storage/ArtifactStorage.js';
import type {
  MemoryConfig,
  Context,
  Artifact,
  Scope,
} from './types.js';

/**
 * Hierarchical Memory System
 *
 * Manages context across multiple scopes for complex multi-submodule projects.
 */
export class HierarchicalMemory {
  private scopes: Map<string, Scope>;
  private compression: ContextCompressionEngine;
  private storage: ArtifactStorage;
  private config: MemoryConfig;

  constructor(config: MemoryConfig) {
    this.config = config;
    this.scopes = new Map();

    // Initialize scopes
    this.initializeScopes();

    // Initialize compression engine
    this.compression = new ContextCompressionEngine(
      config.compression || {
        targetTokens: 100000,
        compressionLevel: 0.5,
        scopeBudgets: {
          repository: 0.1,
          submodule: 0.3,
          session: 0.3,
          task: 0.3,
        },
      }
    );

    // Initialize storage
    this.storage = new ArtifactStorage(
      config.storage || {
        backend: 'filesystem',
        path: '.beads/memory',
        maxSize: 1000,
        retentionDays: 90,
      }
    );
  }

  /**
   * Initialize all scopes
   */
  private initializeScopes(): void {
    // Repository scope
    this.scopes.set(
      'repository',
      new RepositoryScope({
        repository: this.config.repository,
        tokenBudget: 0.1,
      })
    );

    // Submodule scopes
    for (const submodule of this.config.submodules) {
      this.scopes.set(
        `submodule:${submodule}`,
        new SubmoduleScope({
          submodule,
          repository: this.config.repository,
          tokenBudget: 0.3,
        })
      );
    }

    // Session scope
    this.scopes.set(
      'session',
      new SessionScope({
        tokenBudget: 0.3,
      })
    );

    // Task scope (created on-demand)
    // Task scopes are created dynamically via createTaskScope()
  }

  /**
   * Store artifact in appropriate scope
   */
  async store(artifact: Artifact): Promise<void> {
    const scopeName = this.getScopeName(artifact);
    const scope = this.scopes.get(scopeName);

    if (!scope) {
      throw new Error(`Scope not found: ${scopeName}`);
    }

    // Store in scope
    await scope.store(artifact);

    // Persist to storage
    await this.storage.store(artifact);
  }

  /**
   * Retrieve relevant context from all scopes
   */
  async retrieve(query: string, activeScope?: string): Promise<Context> {
    // Collect artifacts from all scopes
    const allArtifacts: Artifact[] = [];

    for (const [scopeName, scope] of this.scopes.entries()) {
      // Skip task scopes unless active
      if (scopeName.startsWith('task:') && scopeName !== activeScope) {
        continue;
      }

      const artifacts = await scope.retrieve(query);
      allArtifacts.push(...artifacts);
    }

    // Compress context
    const compressed = await this.compression.compress(allArtifacts, {
      activeScope,
      targetTokens: this.config.compression?.targetTokens || 100000,
    });

    // Build scope breakdown
    const scopeBreakdown: Context['scopes'] = {};
    for (const artifact of compressed.artifacts) {
      const scopeName = this.getScopeName(artifact);
      if (!scopeBreakdown[scopeName]) {
        scopeBreakdown[scopeName] = {
          artifacts: 0,
          tokens: 0,
        };
      }
      scopeBreakdown[scopeName].artifacts++;
      scopeBreakdown[scopeName].tokens += this.estimateTokens(artifact.content);
    }

    return {
      artifacts: compressed.artifacts,
      compressionRatio: compressed.ratio,
      totalTokens: compressed.totalTokens,
      scopes: scopeBreakdown,
    };
  }

  /**
   * Create task scope for specific issue
   */
  async createTaskScope(taskId: string, taskContext: any): Promise<void> {
    const scopeName = `task:${taskId}`;

    if (this.scopes.has(scopeName)) {
      throw new Error(`Task scope already exists: ${scopeName}`);
    }

    const taskScope = new TaskScope({
      taskId,
      taskContext,
      tokenBudget: 0.3,
    });

    this.scopes.set(scopeName, taskScope);

    // Inject relevant notes from other scopes
    await this.injectRelevantNotes(taskId, taskContext);
  }

  /**
   * Inject relevant notes into task scope
   */
  private async injectRelevantNotes(
    taskId: string,
    taskContext: any
  ): Promise<void> {
    const query = this.buildQueryFromTask(taskContext);
    const context = await this.retrieve(query, `task:${taskId}`);

    // Store relevant artifacts in task scope
    for (const artifact of context.artifacts) {
      await this.store({
        ...artifact,
        metadata: {
          ...artifact.metadata,
          scope: 'task',
          taskId,
        },
      });
    }
  }

  /**
   * Get scope name from artifact metadata
   */
  private getScopeName(artifact: Artifact): string {
    const { scope, submodule, taskId } = artifact.metadata;

    if (scope === 'task' && taskId) {
      return `task:${taskId}`;
    } else if (scope === 'submodule' && submodule) {
      return `submodule:${submodule}`;
    } else {
      return scope;
    }
  }

  /**
   * Build search query from task context
   */
  private buildQueryFromTask(taskContext: any): string {
    // Extract key terms from task title and description
    const title = taskContext.title || '';
    const description = taskContext.description || '';

    return `${title} ${description}`.substring(0, 500);
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Clear all scopes (useful for testing)
   */
  async clear(): Promise<void> {
    for (const scope of this.scopes.values()) {
      await scope.clear();
    }
  }

  /**
   * Get statistics about memory usage
   */
  async getStats(): Promise<{
    scopes: number;
    artifacts: number;
    totalTokens: number;
  }> {
    let totalArtifacts = 0;
    let totalTokens = 0;

    for (const scope of this.scopes.values()) {
      const stats = await scope.getStats();
      totalArtifacts += stats.artifacts;
      totalTokens += stats.tokens;
    }

    return {
      scopes: this.scopes.size,
      artifacts: totalArtifacts,
      totalTokens,
    };
  }
}
