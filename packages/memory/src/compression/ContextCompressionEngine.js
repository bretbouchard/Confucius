"use strict";
/**
 * ContextCompressionEngine - Compress context while preserving critical information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextCompressionEngine = void 0;
/**
 * Context compression engine
 */
class ContextCompressionEngine {
    constructor(config) {
        this.config = config;
    }
    /**
     * Compress artifacts to fit within target token budget
     */
    async compress(artifacts, options) {
        // Handle empty artifact list
        if (artifacts.length === 0) {
            return {
                artifacts: [],
                ratio: 0,
                totalTokens: 0,
                originalTokens: 0,
            };
        }
        // Calculate original tokens
        const originalTokens = this.countTokens(artifacts);
        // If already under budget, return as-is
        if (originalTokens <= options.targetTokens) {
            return {
                artifacts,
                ratio: 1.0,
                totalTokens: originalTokens,
                originalTokens,
            };
        }
        // Sort artifacts by importance (confidence, recency, etc.)
        const sorted = this.sortByImportance(artifacts);
        // Select artifacts to fit within budget
        const selected = [];
        let totalTokens = 0;
        for (const artifact of sorted) {
            const tokens = this.estimateTokens(artifact.content);
            if (totalTokens + tokens <= options.targetTokens) {
                selected.push(artifact);
                totalTokens += tokens;
            }
            if (totalTokens >= options.targetTokens) {
                break;
            }
        }
        const ratio = selected.length / artifacts.length;
        return {
            artifacts: selected,
            ratio,
            totalTokens,
            originalTokens,
        };
    }
    /**
     * Sort artifacts by importance
     */
    sortByImportance(artifacts) {
        return [...artifacts].sort((a, b) => {
            // Higher confidence first
            const aConfidence = a.metadata.confidence || 0.5;
            const bConfidence = b.metadata.confidence || 0.5;
            if (aConfidence !== bConfidence) {
                return bConfidence - aConfidence;
            }
            // More recent first
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
    }
    /**
     * Count total tokens in artifacts
     */
    countTokens(artifacts) {
        return artifacts.reduce((sum, artifact) => sum + this.estimateTokens(artifact.content), 0);
    }
    /**
     * Estimate token count for text
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
}
exports.ContextCompressionEngine = ContextCompressionEngine;
//# sourceMappingURL=ContextCompressionEngine.js.map