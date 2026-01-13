/**
 * FileSystemStorage - Filesystem-based artifact storage
 */

import type { StorageBackend, StorageConfig } from './types.js';
import type { Artifact } from '../core/types.js';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Filesystem-based storage backend
 */
export class FileSystemStorage implements StorageBackend {
  private config: StorageConfig;
  private storagePath: string;

  constructor(config: StorageConfig) {
    this.config = config;
    this.storagePath = config.path;
  }

  /**
   * Store artifact
   */
  async store(artifact: Artifact): Promise<void> {
    const filePath = this.getArtifactPath(artifact.id);
    const dirPath = join(filePath, '..');

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write artifact to file
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2));
  }

  /**
   * Retrieve artifact by ID
   */
  async retrieve(id: string): Promise<Artifact | null> {
    try {
      const filePath = this.getArtifactPath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const artifact = JSON.parse(content) as Artifact;
      // Convert date string back to Date object
      artifact.timestamp = new Date(artifact.timestamp);
      return artifact;
    } catch {
      return null;
    }
  }

  /**
   * Search artifacts by query
   */
  async search(query: string): Promise<Artifact[]> {
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
  async list(): Promise<Artifact[]> {
    const artifacts: Artifact[] = [];

    try {
      const files = await this.getAllArtifactFiles();

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const artifact = JSON.parse(content) as Artifact;
          // Convert date string back to Date object
          artifact.timestamp = new Date(artifact.timestamp);
          artifacts.push(artifact);
        } catch {
          // Skip invalid files
          continue;
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    return artifacts;
  }

  /**
   * Delete artifact
   */
  async delete(id: string): Promise<void> {
    try {
      const filePath = this.getArtifactPath(id);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Clear all artifacts
   */
  async clear(): Promise<void> {
    await fs.rm(this.storagePath, { recursive: true, force: true });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    count: number;
    size: number;
  }> {
    const artifacts = await this.list();
    const size = artifacts.reduce(
      (sum, artifact) => sum + artifact.content.length,
      0
    );

    return {
      count: artifacts.length,
      size,
    };
  }

  /**
   * Get file path for artifact
   */
  private getArtifactPath(id: string): string {
    // Use first 2 characters as subdirectory for better performance
    const prefix = id.substring(0, 2);
    return join(this.storagePath, prefix, `${id}.json`);
  }

  /**
   * Get all artifact files
   */
  private async getAllArtifactFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(this.storagePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = join(this.storagePath, entry.name);
          const subEntries = await fs.readdir(subPath);

          for (const subEntry of subEntries) {
            if (subEntry.endsWith('.json')) {
              files.push(join(subPath, subEntry));
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist yet
    }

    return files;
  }
}
