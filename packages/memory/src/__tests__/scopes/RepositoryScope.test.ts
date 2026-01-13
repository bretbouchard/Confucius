/**
 * RepositoryScope unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RepositoryScope } from '../../scopes/RepositoryScope.js';
import type { RepositoryScopeConfig } from '../../scopes/types.js';
import type { Artifact } from '../../core/types.js';

describe('RepositoryScope', () => {
  let scope: RepositoryScope;
  let config: RepositoryScopeConfig;

  beforeEach(() => {
    config = {
      repository: '/test/repo',
      tokenBudget: 0.1,
    };
    scope = new RepositoryScope(config);
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      const retrievedConfig = scope.getConfig();
      expect(retrievedConfig.repository).toBe(config.repository);
      expect(retrievedConfig.tokenBudget).toBe(config.tokenBudget);
    });
  });

  describe('artifact storage', () => {
    it('should store artifact', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'Test pattern',
        metadata: {
          scope: 'repository',
          tags: ['test'],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      const stats = await scope.getStats();

      expect(stats.artifacts).toBe(1);
    });

    it('should store multiple artifacts', async () => {
      const artifacts: Artifact[] = [
        {
          id: 'test-1',
          type: 'pattern',
          content: 'Pattern 1',
          metadata: { scope: 'repository', tags: ['tag1'] },
          timestamp: new Date(),
        },
        {
          id: 'test-2',
          type: 'pattern',
          content: 'Pattern 2',
          metadata: { scope: 'repository', tags: ['tag2'] },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await scope.store(artifact);
      }

      const stats = await scope.getStats();
      expect(stats.artifacts).toBe(2);
    });
  });

  describe('artifact retrieval', () => {
    beforeEach(async () => {
      const artifacts: Artifact[] = [
        {
          id: 'test-1',
          type: 'pattern',
          content: 'TypeScript strict mode is required',
          metadata: {
            scope: 'repository',
            tags: ['typescript', 'best-practice'],
          },
          timestamp: new Date(),
        },
        {
          id: 'test-2',
          type: 'pattern',
          content: 'Use Vitest for testing',
          metadata: {
            scope: 'repository',
            tags: ['testing', 'vitest'],
          },
          timestamp: new Date(),
        },
        {
          id: 'test-3',
          type: 'error_message',
          content: 'Python version mismatch in CI',
          metadata: {
            scope: 'repository',
            tags: ['ci', 'python', 'error'],
          },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await scope.store(artifact);
      }
    });

    it('should retrieve artifacts by content keyword', async () => {
      const results = await scope.retrieve('typescript');
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should retrieve artifacts by tag', async () => {
      const results = await scope.retrieve('testing');
      expect(results.length).toBe(1);
      expect(results[0].metadata.tags).toContain('testing');
    });

    it('should retrieve multiple matching artifacts', async () => {
      const results = await scope.retrieve('mode');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const results = await scope.retrieve('nonexistent_xyz123');
      expect(results.length).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const results1 = await scope.retrieve('TYPESCRIPT');
      const results2 = await scope.retrieve('typescript');
      expect(results1.length).toBe(results2.length);
    });
  });

  describe('statistics', () => {
    it('should return zero stats initially', async () => {
      const stats = await scope.getStats();
      expect(stats.artifacts).toBe(0);
      expect(stats.tokens).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should calculate tokens correctly', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'a'.repeat(100), // ~25 tokens
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      const stats = await scope.getStats();

      expect(stats.tokens).toBeGreaterThan(0);
      expect(stats.tokens).toBeLessThan(100); // Should be ~25
    });

    it('should calculate size correctly', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'test content',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      const stats = await scope.getStats();

      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('clear operations', () => {
    it('should clear all artifacts', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'Test',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      expect(await (await scope.getStats()).artifacts).toBe(1);

      await scope.clear();
      expect(await (await scope.getStats()).artifacts).toBe(0);
    });
  });
});
