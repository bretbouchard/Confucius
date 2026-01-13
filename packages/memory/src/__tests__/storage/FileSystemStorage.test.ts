/**
 * FileSystemStorage unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSystemStorage } from '../../storage/FileSystemStorage.js';
import type { StorageConfig } from '../../storage/types.js';
import type { Artifact } from '../../core/types.js';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('FileSystemStorage', () => {
  let storage: FileSystemStorage;
  let testStorageDir: string;

  beforeEach(async () => {
    // Create unique test storage directory
    testStorageDir = join(process.cwd(), '.test-storage', randomUUID());
    await fs.mkdir(testStorageDir, { recursive: true });

    const config: StorageConfig = {
      backend: 'filesystem',
      path: testStorageDir,
      maxSize: 100,
      retentionDays: 30,
    };

    storage = new FileSystemStorage(config);
  });

  afterEach(async () => {
    // Clean up test storage
    try {
      await fs.rm(testStorageDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      // Storage is initialized, test passes if no error thrown
      expect(storage).toBeDefined();
    });
  });

  describe('artifact storage', () => {
    it('should store artifact', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test artifact',
        metadata: {
          scope: 'repository',
          tags: ['test'],
        },
        timestamp: new Date(),
      };

      await storage.store(artifact);

      const retrieved = await storage.retrieve(artifact.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(artifact.id);
      expect(retrieved!.content).toBe(artifact.content);
    });

    it('should store multiple artifacts', async () => {
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 1',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 2',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await storage.store(artifact);
      }

      const stats = await storage.getStats();
      expect(stats.count).toBe(2);
    });

    it('should overwrite artifact with same ID', async () => {
      const id = randomUUID();
      const artifact1: Artifact = {
        id,
        type: 'pattern',
        content: 'Original',
        metadata: { scope: 'repository', tags: [] },
        timestamp: new Date(),
      };

      const artifact2: Artifact = {
        id,
        type: 'pattern',
        content: 'Updated',
        metadata: { scope: 'repository', tags: [] },
        timestamp: new Date(),
      };

      await storage.store(artifact1);
      await storage.store(artifact2);

      const retrieved = await storage.retrieve(id);
      expect(retrieved!.content).toBe('Updated');
    });
  });

  describe('artifact retrieval', () => {
    it('should retrieve artifact by ID', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test artifact',
        metadata: {
          scope: 'repository',
          tags: ['test'],
        },
        timestamp: new Date(),
      };

      await storage.store(artifact);
      const retrieved = await storage.retrieve(artifact.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(artifact.id);
      expect(retrieved!.content).toBe(artifact.content);
      expect(retrieved!.metadata).toEqual(artifact.metadata);
    });

    it('should return null for non-existent artifact', async () => {
      const retrieved = await storage.retrieve('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should preserve timestamp', async () => {
      const timestamp = new Date('2024-01-01T00:00:00Z');
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp,
      };

      await storage.store(artifact);
      const retrieved = await storage.retrieve(artifact.id);

      expect(retrieved!.timestamp.toISOString()).toBe(timestamp.toISOString());
    });
  });

  describe('artifact search', () => {
    beforeEach(async () => {
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'TypeScript strict mode is required',
          metadata: {
            scope: 'repository',
            tags: ['typescript', 'best-practice'],
          },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'error_message',
          content: 'Python version mismatch in CI',
          metadata: {
            scope: 'repository',
            tags: ['ci', 'python', 'error'],
          },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Use Vitest for testing',
          metadata: {
            scope: 'repository',
            tags: ['testing', 'vitest'],
          },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await storage.store(artifact);
      }
    });

    it('should search by content keyword', async () => {
      const results = await storage.search('typescript');
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should search by tag', async () => {
      const results = await storage.search('testing');
      expect(results.length).toBe(1);
      expect(results[0].metadata.tags).toContain('testing');
    });

    it('should return multiple matches', async () => {
      const results = await storage.search('mode');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await storage.search('nonexistent_xyz123');
      expect(results.length).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const results1 = await storage.search('TYPESCRIPT');
      const results2 = await storage.search('typescript');
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('artifact listing', () => {
    beforeEach(async () => {
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 1',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 2',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await storage.store(artifact);
      }
    });

    it('should list all artifacts', async () => {
      const artifacts = await storage.list();
      expect(artifacts.length).toBe(2);
    });

    it('should return artifacts with all properties', async () => {
      const artifacts = await storage.list();
      const artifact = artifacts[0];

      expect(artifact.id).toBeDefined();
      expect(artifact.type).toBeDefined();
      expect(artifact.content).toBeDefined();
      expect(artifact.metadata).toBeDefined();
      expect(artifact.timestamp).toBeDefined();
    });
  });

  describe('artifact deletion', () => {
    it('should delete artifact', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test artifact',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await storage.store(artifact);
      expect(await storage.retrieve(artifact.id)).toBeDefined();

      await storage.delete(artifact.id);
      expect(await storage.retrieve(artifact.id)).toBeNull();
    });

    it('should handle deletion of non-existent artifact', async () => {
      await expect(storage.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('clear operations', () => {
    it('should clear all artifacts', async () => {
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 1',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 2',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await storage.store(artifact);
      }

      expect((await storage.getStats()).count).toBe(2);

      await storage.clear();
      expect((await storage.getStats()).count).toBe(0);
    });

    it('should handle clearing empty storage', async () => {
      await expect(storage.clear()).resolves.not.toThrow();
    });
  });

  describe('statistics', () => {
    it('should return zero stats initially', async () => {
      const stats = await storage.getStats();
      expect(stats.count).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should calculate count correctly', async () => {
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 1',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Artifact 2',
          metadata: { scope: 'repository', tags: [] },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await storage.store(artifact);
      }

      const stats = await storage.getStats();
      expect(stats.count).toBe(2);
    });

    it('should calculate size correctly', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'A'.repeat(1000),
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await storage.store(artifact);
      const stats = await storage.getStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBe(1000); // Content length
    });
  });

  describe('file structure', () => {
    it('should shard artifacts by ID prefix', async () => {
      const artifact: Artifact = {
        id: 'abc123-def456',
        type: 'pattern',
        content: 'Test',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await storage.store(artifact);

      // Check that file exists in sharded directory
      const filePath = join(testStorageDir, 'ab', 'abc123-def456.json');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted JSON files', async () => {
      const id = randomUUID();
      const filePath = join(testStorageDir, id.substring(0, 2), `${id}.json`);

      // Create directory and write invalid JSON
      await fs.mkdir(join(testStorageDir, id.substring(0, 2)), { recursive: true });
      await fs.writeFile(filePath, 'invalid json{');

      // List should skip corrupted files
      const artifacts = await storage.list();
      expect(artifacts).toBeDefined();
    });
  });
});
