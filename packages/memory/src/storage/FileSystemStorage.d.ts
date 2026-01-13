/**
 * FileSystemStorage - Filesystem-based artifact storage
 */
import type { StorageBackend, StorageConfig } from './types';
import type { Artifact } from '../core/types';
/**
 * Filesystem-based storage backend
 */
export declare class FileSystemStorage implements StorageBackend {
    private config;
    private storagePath;
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
    /**
     * Get file path for artifact
     */
    private getArtifactPath;
    /**
     * Get all artifact files
     */
    private getAllArtifactFiles;
}
//# sourceMappingURL=FileSystemStorage.d.ts.map