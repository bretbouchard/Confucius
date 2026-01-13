/**
 * SubmoduleScope - Submodule-specific patterns and workflows
 */

import type {
  Scope,
  SubmoduleScopeConfig,
  ScopeStats,
} from './types.js';
import type { Artifact } from '../core/types.js';

/**
 * Submodule scope for submodule-specific patterns
 */
export class SubmoduleScope implements Scope {
  private config: SubmoduleScopeConfig;
  private artifacts: Map<string, Artifact>;

  constructor(config: SubmoduleScopeConfig) {
    this.config = config;
    this.artifacts = new Map();
  }

  async store(artifact: Artifact): Promise<void> {
    // Only store if artifact belongs to this submodule
    if (artifact.metadata.submodule !== this.config.submodule) {
      throw new Error(
        `Artifact belongs to submodule ${artifact.metadata.submodule}, not ${this.config.submodule}`
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

  getConfig(): SubmoduleScopeConfig {
    return this.config;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
