/**
 * SubmoduleScope - Submodule-specific patterns and workflows
 */
import type { Scope, SubmoduleScopeConfig, ScopeStats } from './types';
import type { Artifact } from '../core/types';
/**
 * Submodule scope for submodule-specific patterns
 */
export declare class SubmoduleScope implements Scope {
    private config;
    private artifacts;
    constructor(config: SubmoduleScopeConfig);
    store(artifact: Artifact): Promise<void>;
    retrieve(query: string): Promise<Artifact[]>;
    clear(): Promise<void>;
    getStats(): Promise<ScopeStats>;
    getConfig(): SubmoduleScopeConfig;
    private estimateTokens;
}
//# sourceMappingURL=SubmoduleScope.d.ts.map