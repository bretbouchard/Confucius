"use strict";
/**
 * ArtifactStorage - Persistent artifact storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactStorage = void 0;
const FileSystemStorage_1 = require("./FileSystemStorage");
/**
 * Artifact storage manager
 */
class ArtifactStorage {
    constructor(config) {
        this.config = config;
        // Initialize backend based on configuration
        if (config.backend === 'filesystem') {
            this.backend = new FileSystemStorage_1.FileSystemStorage(config);
        }
        else {
            throw new Error(`Unsupported storage backend: ${config.backend}`);
        }
    }
    /**
     * Store artifact
     */
    async store(artifact) {
        await this.backend.store(artifact);
    }
    /**
     * Retrieve artifact by ID
     */
    async retrieve(id) {
        return await this.backend.retrieve(id);
    }
    /**
     * Search artifacts by query
     */
    async search(query) {
        return await this.backend.search(query);
    }
    /**
     * List all artifacts
     */
    async list() {
        return await this.backend.list();
    }
    /**
     * Delete artifact
     */
    async delete(id) {
        await this.backend.delete(id);
    }
    /**
     * Clear all artifacts
     */
    async clear() {
        await this.backend.clear();
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        return await this.backend.getStats();
    }
}
exports.ArtifactStorage = ArtifactStorage;
//# sourceMappingURL=ArtifactStorage.js.map