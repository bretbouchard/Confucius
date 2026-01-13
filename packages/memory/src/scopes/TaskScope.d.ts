/**
 * TaskScope - Current task context
 */
import type { Scope, TaskScopeConfig, ScopeStats } from './types';
import type { Artifact } from '../core/types';
/**
 * Task scope for current task context
 */
export declare class TaskScope implements Scope {
    private config;
    private artifacts;
    constructor(config: TaskScopeConfig);
    store(artifact: Artifact): Promise<void>;
    retrieve(query: string): Promise<Artifact[]>;
    clear(): Promise<void>;
    getStats(): Promise<ScopeStats>;
    getConfig(): TaskScopeConfig;
    private estimateTokens;
}
//# sourceMappingURL=TaskScope.d.ts.map