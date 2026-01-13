"use strict";
/**
 * RepositoryScope - Project-wide patterns and conventions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryScope = void 0;
/**
 * Repository scope for project-wide patterns
 */
class RepositoryScope {
    constructor(config) {
        this.config = config;
        this.artifacts = new Map();
    }
    async store(artifact) {
        this.artifacts.set(artifact.id, artifact);
    }
    async retrieve(query) {
        // Simple keyword matching for now
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
exports.RepositoryScope = RepositoryScope;
//# sourceMappingURL=RepositoryScope.js.map