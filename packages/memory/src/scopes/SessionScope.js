"use strict";
/**
 * SessionScope - Current development session context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionScope = void 0;
const crypto_1 = require("crypto");
/**
 * Session scope for current development session
 */
class SessionScope {
    constructor(config) {
        this.config = config;
        this.artifacts = new Map();
        this.sessionId = config.sessionId || (0, crypto_1.randomUUID)();
    }
    async store(artifact) {
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
        return { ...this.config, sessionId: this.sessionId };
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.SessionScope = SessionScope;
//# sourceMappingURL=SessionScope.js.map