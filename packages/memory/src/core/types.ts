/**
 * Core type definitions for CCA Memory System
 */

/**
 * Memory system configuration
 */
export interface MemoryConfig {
  /** Path to repository root */
  repository: string;
  /** List of submodules to track */
  submodules: string[];
  /** Storage backend configuration */
  storage?: StorageConfig;
  /** Compression engine configuration */
  compression?: CompressionConfig;
  /** Beads integration configuration */
  beads?: BeadsConfig;
}

/**
 * Context artifact
 */
export interface Artifact {
  /** Unique identifier */
  id: string;
  /** Artifact type */
  type: ArtifactType;
  /** Artifact content */
  content: string;
  /** Metadata */
  metadata: ArtifactMetadata;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Artifact types
 */
export type ArtifactType =
  | 'code_diff'
  | 'error_message'
  | 'design_decision'
  | 'build_log'
  | 'test_result'
  | 'conversation'
  | 'pattern'
  | 'successful_trajectory'
  | 'failed_trajectory'
  | 'knowledge_state';

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  /** Target scope */
  scope: ScopeType;
  /** Submodule (if applicable) */
  submodule?: string;
  /** Task ID (if applicable) */
  taskId?: string;
  /** File path (if applicable) */
  file?: string;
  /** Language/technology */
  language?: string;
  /** Tags for retrieval */
  tags?: string[];
  /** Confidence score (for learned patterns) */
  confidence?: number;
  /** Related artifacts */
  related?: string[];
  /** Task outcome (for RnG Framework) */
  outcome?: 'success' | 'failure';
  /** Trajectory identifier (for RnG Framework) */
  trajectory?: string;
}

/**
 * Scope types
 */
export type ScopeType = 'repository' | 'submodule' | 'session' | 'task';

/**
 * Retrieved context
 */
export interface Context {
  /** Relevant artifacts */
  artifacts: Artifact[];
  /** Compression ratio */
  compressionRatio: number;
  /** Total tokens */
  totalTokens: number;
  /** Scope breakdown */
  scopes: {
    [key: string]: {
      artifacts: number;
      tokens: number;
    };
  };
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage backend type */
  backend: 'filesystem' | 'database';
  /** Storage path */
  path: string;
  /** Maximum storage size (MB) */
  maxSize?: number;
  /** Retention policy (days) */
  retentionDays?: number;
}

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
 * Beads integration configuration
 */
export interface BeadsConfig {
  /** Path to Beads database */
  databasePath: string;
  /** Auto-create task scopes */
  autoCreateTaskScopes: boolean;
  /** Auto-generate notes on resolution */
  autoGenerateNotes: boolean;
}

/**
 * Scope interface (forward declaration)
 * This is imported from scopes/types but re-exported here for convenience
 */
export interface Scope {
  /** Store artifact in scope */
  store(artifact: Artifact): Promise<void>;
  /** Retrieve artifacts matching query */
  retrieve(query: string): Promise<Artifact[]>;
  /** Clear all artifacts from scope */
  clear(): Promise<void>;
  /** Get scope statistics */
  getStats(): Promise<any>;
}
