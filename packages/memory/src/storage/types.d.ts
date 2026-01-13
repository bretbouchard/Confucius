/**
 * Storage type definitions
 */
import type { Artifact } from '../core/types';
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
 * Artifact metadata
 */
export interface ArtifactMetadata {
    /** Artifact ID */
    id: string;
    /** Artifact type */
    type: string;
    /** Timestamp */
    timestamp: Date;
    /** Scope */
    scope: string;
    /** Submodule (if applicable) */
    submodule?: string;
    /** Task ID (if applicable) */
    taskId?: string;
    /** File path (if applicable) */
    file?: string;
    /** Tags */
    tags?: string[];
    /** Confidence score */
    confidence?: number;
    /** Size in bytes */
    size: number;
}
/**
 * Storage backend interface
 */
export interface StorageBackend {
    /** Store artifact */
    store(artifact: Artifact): Promise<void>;
    /** Retrieve artifact by ID */
    retrieve(id: string): Promise<Artifact | null>;
    /** Search artifacts by query */
    search(query: string): Promise<Artifact[]>;
    /** List all artifacts */
    list(): Promise<Artifact[]>;
    /** Delete artifact */
    delete(id: string): Promise<void>;
    /** Clear all artifacts */
    clear(): Promise<void>;
    /** Get storage statistics */
    getStats(): Promise<{
        count: number;
        size: number;
    }>;
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
//# sourceMappingURL=types.d.ts.map