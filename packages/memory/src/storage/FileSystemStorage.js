"use strict";
/**
 * FileSystemStorage - Filesystem-based artifact storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemStorage = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Filesystem-based storage backend
 */
class FileSystemStorage {
    constructor(config) {
        this.config = config;
        this.storagePath = config.path;
    }
    /**
     * Store artifact
     */
    async store(artifact) {
        const filePath = this.getArtifactPath(artifact.id);
        const dirPath = (0, path_1.join)(filePath, '..');
        // Ensure directory exists
        await fs_1.promises.mkdir(dirPath, { recursive: true });
        // Write artifact to file
        await fs_1.promises.writeFile(filePath, JSON.stringify(artifact, null, 2));
    }
    /**
     * Retrieve artifact by ID
     */
    async retrieve(id) {
        try {
            const filePath = this.getArtifactPath(id);
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            const artifact = JSON.parse(content);
            // Convert date string back to Date object
            artifact.timestamp = new Date(artifact.timestamp);
            return artifact;
        }
        catch {
            return null;
        }
    }
    /**
     * Search artifacts by query
     */
    async search(query) {
        const all = await this.list();
        const queryLower = query.toLowerCase();
        return all.filter((artifact) => {
            const content = artifact.content.toLowerCase();
            const tags = (artifact.metadata.tags || []).join(' ').toLowerCase();
            return content.includes(queryLower) || tags.includes(queryLower);
        });
    }
    /**
     * List all artifacts
     */
    async list() {
        const artifacts = [];
        try {
            const files = await this.getAllArtifactFiles();
            for (const file of files) {
                try {
                    const content = await fs_1.promises.readFile(file, 'utf-8');
                    const artifact = JSON.parse(content);
                    // Convert date string back to Date object
                    artifact.timestamp = new Date(artifact.timestamp);
                    artifacts.push(artifact);
                }
                catch {
                    // Skip invalid files
                    continue;
                }
            }
        }
        catch {
            // Directory doesn't exist yet
        }
        return artifacts;
    }
    /**
     * Delete artifact
     */
    async delete(id) {
        try {
            const filePath = this.getArtifactPath(id);
            await fs_1.promises.unlink(filePath);
        }
        catch {
            // Ignore if file doesn't exist
        }
    }
    /**
     * Clear all artifacts
     */
    async clear() {
        await fs_1.promises.rm(this.storagePath, { recursive: true, force: true });
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        const artifacts = await this.list();
        const size = artifacts.reduce((sum, artifact) => sum + artifact.content.length, 0);
        return {
            count: artifacts.length,
            size,
        };
    }
    /**
     * Get file path for artifact
     */
    getArtifactPath(id) {
        // Use first 2 characters as subdirectory for better performance
        const prefix = id.substring(0, 2);
        return (0, path_1.join)(this.storagePath, prefix, `${id}.json`);
    }
    /**
     * Get all artifact files
     */
    async getAllArtifactFiles() {
        const files = [];
        try {
            const entries = await fs_1.promises.readdir(this.storagePath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const subPath = (0, path_1.join)(this.storagePath, entry.name);
                    const subEntries = await fs_1.promises.readdir(subPath);
                    for (const subEntry of subEntries) {
                        if (subEntry.endsWith('.json')) {
                            files.push((0, path_1.join)(subPath, subEntry));
                        }
                    }
                }
            }
        }
        catch {
            // Directory doesn't exist yet
        }
        return files;
    }
}
exports.FileSystemStorage = FileSystemStorage;
//# sourceMappingURL=FileSystemStorage.js.map