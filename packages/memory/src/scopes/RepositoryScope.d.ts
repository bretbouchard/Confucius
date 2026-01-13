/**
 * RepositoryScope - Project-wide patterns and conventions
 */
import type { Scope, RepositoryScopeConfig, ScopeStats } from './types';
import type { Artifact } from '../core/types';
/**
 * Repository scope for project-wide patterns
 */
export declare class RepositoryScope implements Scope {
    private config;
    private artifacts;
    constructor(config: RepositoryScopeConfig);
    store(artifact: Artifact): Promise<void>;
    retrieve(query: string): Promise<Artifact[]>;
    clear(): Promise<void>;
    getStats(): Promise<ScopeStats>;
    getConfig(): RepositoryScopeConfig;
    private estimateTokens;
}
//# sourceMappingURL=RepositoryScope.d.ts.map