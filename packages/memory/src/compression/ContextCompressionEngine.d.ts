/**
 * ContextCompressionEngine - Compress context while preserving critical information
 */
import type { CompressionConfig, CompressionResult, CompressionOptions } from './types';
import type { Artifact } from '../core/types';
/**
 * Context compression engine
 */
export declare class ContextCompressionEngine {
    private config;
    constructor(config: CompressionConfig);
    /**
     * Compress artifacts to fit within target token budget
     */
    compress(artifacts: Artifact[], options: CompressionOptions): Promise<CompressionResult>;
    /**
     * Sort artifacts by importance
     */
    private sortByImportance;
    /**
     * Count total tokens in artifacts
     */
    private countTokens;
    /**
     * Estimate token count for text
     */
    private estimateTokens;
}
//# sourceMappingURL=ContextCompressionEngine.d.ts.map