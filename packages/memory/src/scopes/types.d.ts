/**
 * Scope type definitions
 */
import type { Artifact } from '../core/types';
/**
 * Base scope configuration
 */
export interface ScopeConfig {
    /** Token budget (0-1) */
    tokenBudget: number;
}
/**
 * Repository scope configuration
 */
export interface RepositoryScopeConfig extends ScopeConfig {
    /** Path to repository root */
    repository: string;
}
/**
 * Submodule scope configuration
 */
export interface SubmoduleScopeConfig extends ScopeConfig {
    /** Submodule name */
    submodule: string;
    /** Path to repository root */
    repository: string;
}
/**
 * Session scope configuration
 */
export interface SessionScopeConfig extends ScopeConfig {
    /** Session ID (optional, auto-generated if not provided) */
    sessionId?: string;
}
/**
 * Task scope configuration
 */
export interface TaskScopeConfig extends ScopeConfig {
    /** Task ID (e.g., bd-123) */
    taskId: string;
    /** Task context from Beads */
    taskContext: any;
}
/**
 * Scope statistics
 */
export interface ScopeStats {
    /** Number of artifacts in scope */
    artifacts: number;
    /** Estimated token count */
    tokens: number;
    /** Scope size (bytes) */
    size: number;
}
/**
 * Scope interface
 */
export interface Scope {
    /** Store artifact in scope */
    store(artifact: Artifact): Promise<void>;
    /** Retrieve artifacts matching query */
    retrieve(query: string): Promise<Artifact[]>;
    /** Clear all artifacts from scope */
    clear(): Promise<void>;
    /** Get scope statistics */
    getStats(): Promise<ScopeStats>;
    /** Get scope configuration */
    getConfig(): ScopeConfig;
}
//# sourceMappingURL=types.d.ts.map