/**
 * SubmoduleScope unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubmoduleScope } from '../../scopes/SubmoduleScope.js';
import type { SubmoduleScopeConfig } from '../../scopes/types.js';
import type { Artifact } from '../../core/types.js';

describe('SubmoduleScope', () => {
  let scope: SubmoduleScope;
  let config: SubmoduleScopeConfig;

  beforeEach(() => {
    config = {
      submodule: 'sdk',
      repository: '/test/repo',
      tokenBudget: 0.3,
    };
    scope = new SubmoduleScope(config);
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      const retrievedConfig = scope.getConfig();
      expect(retrievedConfig.submodule).toBe(config.submodule);
      expect(retrievedConfig.repository).toBe(config.repository);
      expect(retrievedConfig.tokenBudget).toBe(config.tokenBudget);
    });
  });

  describe('artifact storage', () => {
    it('should store artifact for matching submodule', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'SDK pattern',
        metadata: {
          scope: 'submodule',
          submodule: 'sdk',
          tags: ['typescript'],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      const stats = await scope.getStats();
      expect(stats.artifacts).toBe(1);
    });

    it('should reject artifact for different submodule', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'Wrong artifact',
        metadata: {
          scope: 'submodule',
          submodule: 'juce_backend', // Different from scope
          tags: [],
        },
        timestamp: new Date(),
      };

      await expect(scope.store(artifact)).rejects.toThrow();
    });

    it('should store multiple artifacts', async () => {
      const artifacts: Artifact[] = [
        {
          id: 'test-1',
          type: 'pattern',
          content: 'SDK pattern 1',
          metadata: { scope: 'submodule', submodule: 'sdk', tags: [] },
          timestamp: new Date(),
        },
        {
          id: 'test-2',
          type: 'pattern',
          content: 'SDK pattern 2',
          metadata: { scope: 'submodule', submodule: 'sdk', tags: [] },
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
          content: 'SDK uses TypeScript strict mode',
          metadata: {
            scope: 'submodule',
            submodule: 'sdk',
            tags: ['typescript', 'best-practice'],
          },
          timestamp: new Date(),
        },
        {
          id: 'test-2',
          type: 'error_message',
          content: 'ESLint configuration error',
          metadata: {
            scope: 'submodule',
            submodule: 'sdk',
            tags: ['eslint', 'error'],
          },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await scope.store(artifact);
      }
    });

    it('should retrieve artifacts by keyword', async () => {
      const results = await scope.retrieve('typescript');
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should retrieve artifacts by tag', async () => {
      const results = await scope.retrieve('eslint');
      expect(results.length).toBe(1);
      expect(results[0].metadata.tags).toContain('eslint');
    });

    it('should return empty array for no matches', async () => {
      const results = await scope.retrieve('nonexistent_xyz123');
      expect(results.length).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should return zero stats initially', async () => {
      const stats = await scope.getStats();
      expect(stats.artifacts).toBe(0);
      expect(stats.tokens).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should calculate stats correctly', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'SDK test artifact',
        metadata: {
          scope: 'submodule',
          submodule: 'sdk',
          tags: [],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      const stats = await scope.getStats();

      expect(stats.artifacts).toBe(1);
      expect(stats.tokens).toBeGreaterThan(0);
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
          scope: 'submodule',
          submodule: 'sdk',
          tags: [],
        },
        timestamp: new Date(),
      };

      await scope.store(artifact);
      await scope.clear();

      const stats = await scope.getStats();
      expect(stats.artifacts).toBe(0);
    });
  });
});
