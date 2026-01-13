"use strict";
/**
 * SubmoduleScope - Submodule-specific patterns and workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmoduleScope = void 0;
/**
 * Submodule scope for submodule-specific patterns
 */
class SubmoduleScope {
    constructor(config) {
        this.config = config;
        this.artifacts = new Map();
    }
    async store(artifact) {
        // Only store if artifact belongs to this submodule
        if (artifact.metadata.submodule !== this.config.submodule) {
            throw new Error(`Artifact belongs to submodule ${artifact.metadata.submodule}, not ${this.config.submodule}`);
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
exports.SubmoduleScope = SubmoduleScope;
//# sourceMappingURL=SubmoduleScope.js.map