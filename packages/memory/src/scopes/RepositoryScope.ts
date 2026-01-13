/**
 * RepositoryScope - Project-wide patterns and conventions
 */

import type {
  Scope,
  RepositoryScopeConfig,
  ScopeStats,
} from './types.js';
import type { Artifact } from '../core/types.js';

/**
 * Repository scope for project-wide patterns
 */
export class RepositoryScope implements Scope {
  private config: RepositoryScopeConfig;
  private artifacts: Map<string, Artifact>;

  constructor(config: RepositoryScopeConfig) {
    this.config = config;
    this.artifacts = new Map();
  }

  async store(artifact: Artifact): Promise<void> {
    this.artifacts.set(artifact.id, artifact);
  }

  async retrieve(query: string): Promise<Artifact[]> {
    // Simple keyword matching for now
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

  getConfig(): RepositoryScopeConfig {
    return this.config;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
