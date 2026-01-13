/**
 * SessionScope - Current development session context
 */
import type { Scope, SessionScopeConfig, ScopeStats } from './types';
import type { Artifact } from '../core/types';
/**
 * Session scope for current development session
 */
export declare class SessionScope implements Scope {
    private config;
    private artifacts;
    private sessionId;
    constructor(config: SessionScopeConfig);
    store(artifact: Artifact): Promise<void>;
    retrieve(query: string): Promise<Artifact[]>;
    clear(): Promise<void>;
    getStats(): Promise<ScopeStats>;
    getConfig(): SessionScopeConfig;
    private estimateTokens;
}
//# sourceMappingURL=SessionScope.d.ts.map