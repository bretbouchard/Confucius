/**
 * ArtifactStorage - Persistent artifact storage
 */
import type { StorageConfig } from './types';
import type { Artifact } from '../core/types';
/**
 * Artifact storage manager
 */
export declare class ArtifactStorage {
    private backend;
    private config;
    constructor(config: StorageConfig);
    /**
     * Store artifact
     */
    store(artifact: Artifact): Promise<void>;
    /**
     * Retrieve artifact by ID
     */
    retrieve(id: string): Promise<Artifact | null>;
    /**
     * Search artifacts by query
     */
    search(query: string): Promise<Artifact[]>;
    /**
     * List all artifacts
     */
    list(): Promise<Artifact[]>;
    /**
     * Delete artifact
     */
    delete(id: string): Promise<void>;
    /**
     * Clear all artifacts
     */
    clear(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        count: number;
        size: number;
    }>;
}
//# sourceMappingURL=ArtifactStorage.d.ts.map