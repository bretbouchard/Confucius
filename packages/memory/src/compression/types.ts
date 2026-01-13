/**
 * Compression type definitions
 */

import type { Artifact } from '../core/types.js';

/**
 * Compression configuration
 */
export interface CompressionConfig {
  /** Target token budget */
  targetTokens: number;
  /** Compression level (0-1) */
  compressionLevel: number;
  /** Scope token budgets */
  scopeBudgets: {
    repository: number;
    submodule: number;
    session: number;
    task: number;
  };
}

/**
 * Compression result
 */
export interface CompressionResult {
  /** Compressed artifacts */
  artifacts: Artifact[];
  /** Compression ratio (0-1) */
  ratio: number;
  /** Total token count */
  totalTokens: number;
  /** Original token count */
  originalTokens: number;
}

/**
 * Compression options
 */
export interface CompressionOptions {
  /** Active scope name */
  activeScope?: string;
  /** Target token count */
  targetTokens: number;
  /** Preserve critical artifacts */
  preserveCritical?: boolean;
}

/**
 * Artifact extractor interface
 */
export interface ArtifactExtractor {
  /** Extract artifacts from context */
  extract(context: string): Promise<Artifact[]>;
  /** Extract code diffs */
  extractDiffs(diff: string): Promise<Artifact>;
  /** Extract error messages */
  extractErrors(log: string): Promise<Artifact[]>;
  /** Extract design decisions */
  extractDecisions(conversation: string): Promise<Artifact[]>;
}

/**
 * Context summarizer interface
 */
export interface ContextSummarizer {
  /** Summarize context */
  summarize(context: string): Promise<string>;
  /** Summarize conversation */
  summarizeConversation(messages: any[]): Promise<string>;
  /** Summarize code changes */
  summarizeCode(changes: string): Promise<string>;
}
