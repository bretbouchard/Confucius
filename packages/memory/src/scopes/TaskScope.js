"use strict";
/**
 * TaskScope - Current task context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskScope = void 0;
/**
 * Task scope for current task context
 */
class TaskScope {
    constructor(config) {
        this.config = config;
        this.artifacts = new Map();
    }
    async store(artifact) {
        // Only store if artifact belongs to this task
        if (artifact.metadata.taskId !== this.config.taskId) {
            throw new Error(`Artifact belongs to task ${artifact.metadata.taskId}, not ${this.config.taskId}`);
        }
        this.artifacts.set(artifact.id, artifact);
    }
    async retrieve(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        for (const artifact of this.artifacts.values()) {
            const content = artifact.content.toLowerCase();
            const tags = (artifact.metadata.tags || []).join(' ').toLowerCase();
            if (content.includes(queryLower) ||
                tags.includes(queryLower)) {
                results.push(artifact);
            }
        }
        return results;
    }
    async clear() {
        this.artifacts.clear();
    }
    async getStats() {
        let totalTokens = 0;
        let totalSize = 0;
        for (const artifact of this.artifacts.values()) {
            totalTokens += this.estimateTokens(artifact.content);
            totalSize += artifact.content.length;
        }
        return {
            artifacts: this.artifacts.size,
            tokens: totalTokens,
            size: totalSize,
        };
    }
    getConfig() {
        return this.config;
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.TaskScope = TaskScope;
//# sourceMappingURL=TaskScope.js.map