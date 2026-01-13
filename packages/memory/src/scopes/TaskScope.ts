/**
 * TaskScope - Current task context
 */

import type {
  Scope,
  TaskScopeConfig,
  ScopeStats,
} from './types.js';
import type { Artifact } from '../core/types.js';

/**
 * Task scope for current task context
 */
export class TaskScope implements Scope {
  private config: TaskScopeConfig;
  private artifacts: Map<string, Artifact>;

  constructor(config: TaskScopeConfig) {
    this.config = config;
    this.artifacts = new Map();
  }

  async store(artifact: Artifact): Promise<void> {
    // Only store if artifact belongs to this task
    if (artifact.metadata.taskId !== this.config.taskId) {
      throw new Error(
        `Artifact belongs to task ${artifact.metadata.taskId}, not ${this.config.taskId}`
      );
    }

    this.artifacts.set(artifact.id, artifact);
  }

  async retrieve(query: string): Promise<Artifact[]> {
    const results: Artifact[] = [];
    const queryLower = query.toLowerCase();

    for (const artifact of this.artifacts.values()) {
      const content = artifact.content.toLowerCase();
      const tags = (artifact.metadata.tags || []).join(' ').toLowerCase();

      if (
        content.includes(queryLower) ||
        tags.includes(queryLower)
      ) {
        results.push(artifact);
      }
    }

    return results;
  }

  async clear(): Promise<void> {
    this.artifacts.clear();
  }

  async getStats(): Promise<ScopeStats> {
    let totalTokens = 0;
    let totalSize = 0;

    for (const artifact of this.artifacts.values()) {
      totalTokens += this.estimateTokens(artifact.content);
      totalSize += artifact.content.length;
    }

    return {
      artifacts: this.artifacts.size,
      tokens: totalTokens,
      size: totalSize,
    };
  }

  getConfig(): TaskScopeConfig {
    return this.config;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
