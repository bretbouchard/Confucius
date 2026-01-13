/**
 * HierarchicalMemory - Multi-scope context management system
 */
import type { MemoryConfig, Context, Artifact } from './types';
/**
 * Hierarchical Memory System
 *
 * Manages context across multiple scopes for complex multi-submodule projects.
 */
export declare class HierarchicalMemory {
    private scopes;
    private compression;
    private storage;
    private config;
    constructor(config: MemoryConfig);
    /**
     * Initialize all scopes
     */
    private initializeScopes;
    /**
     * Store artifact in appropriate scope
     */
    store(artifact: Artifact): Promise<void>;
    /**
     * Retrieve relevant context from all scopes
     */
    retrieve(query: string, activeScope?: string): Promise<Context>;
    /**
     * Create task scope for specific issue
     */
    createTaskScope(taskId: string, taskContext: any): Promise<void>;
    /**
     * Inject relevant notes into task scope
     */
    private injectRelevantNotes;
    /**
     * Get scope name from artifact metadata
     */
    private getScopeName;
    /**
     * Build search query from task context
     */
    private buildQueryFromTask;
    /**
     * Estimate token count for text
     */
    private estimateTokens;
    /**
     * Clear all scopes (useful for testing)
     */
    clear(): Promise<void>;
    /**
     * Get statistics about memory usage
     */
    getStats(): Promise<{
        scopes: number;
        artifacts: number;
        totalTokens: number;
    }>;
}
//# sourceMappingURL=HierarchicalMemory.d.ts.map