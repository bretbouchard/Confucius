/**
 * SessionScope - Current development session context
 */

import type {
  Scope,
  SessionScopeConfig,
  ScopeStats,
} from './types.js';
import type { Artifact } from '../core/types.js';
import { randomUUID } from 'crypto';

/**
 * Session scope for current development session
 */
export class SessionScope implements Scope {
  private config: SessionScopeConfig;
  private artifacts: Map<string, Artifact>;
  private sessionId: string;

  constructor(config: SessionScopeConfig) {
    this.config = config;
    this.artifacts = new Map();
    this.sessionId = config.sessionId || randomUUID();
  }

  async store(artifact: Artifact): Promise<void> {
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

  getConfig(): SessionScopeConfig {
    return { ...this.config, sessionId: this.sessionId };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
