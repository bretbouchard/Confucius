/**
 * ArtifactStorage - Persistent artifact storage
 */

import type { StorageConfig, StorageBackend } from './types.js';
import type { Artifact } from '../core/types.js';
import { FileSystemStorage } from './FileSystemStorage.js';

/**
 * Artifact storage manager
 */
export class ArtifactStorage {
  private backend: StorageBackend;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;

    // Initialize backend based on configuration
    if (config.backend === 'filesystem') {
      this.backend = new FileSystemStorage(config);
    } else {
      throw new Error(`Unsupported storage backend: ${config.backend}`);
    }
  }

  /**
   * Store artifact
   */
  async store(artifact: Artifact): Promise<void> {
    await this.backend.store(artifact);
  }

  /**
   * Retrieve artifact by ID
   */
  async retrieve(id: string): Promise<Artifact | null> {
    return await this.backend.retrieve(id);
  }

  /**
   * Search artifacts by query
   */
  async search(query: string): Promise<Artifact[]> {
    return await this.backend.search(query);
  }

  /**
   * List all artifacts
   */
  async list(): Promise<Artifact[]> {
    return await this.backend.list();
  }

  /**
   * Delete artifact
   */
  async delete(id: string): Promise<void> {
    await this.backend.delete(id);
  }

  /**
   * Clear all artifacts
   */
  async clear(): Promise<void> {
    await this.backend.clear();
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    count: number;
    size: number;
  }> {
    return await this.backend.getStats();
  }
}
