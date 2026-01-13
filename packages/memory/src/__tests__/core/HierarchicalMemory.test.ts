/**
 * HierarchicalMemory unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HierarchicalMemory } from '../../core/HierarchicalMemory.js';
import type { MemoryConfig, Artifact } from '../../core/types.js';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('HierarchicalMemory', () => {
  let memory: HierarchicalMemory;
  let testConfig: MemoryConfig;
  let testStorageDir: string;

  beforeEach(async () => {
    // Create unique test storage directory
    testStorageDir = join(process.cwd(), '.test-memory', randomUUID());
    await fs.mkdir(testStorageDir, { recursive: true });

    testConfig = {
      repository: process.cwd(),
      submodules: ['sdk', 'juce_backend', 'swift_frontend'],
      storage: {
        backend: 'filesystem',
        path: testStorageDir,
        maxSize: 100,
        retentionDays: 30,
      },
      compression: {
        targetTokens: 10000,
        compressionLevel: 0.5,
        scopeBudgets: {
          repository: 0.1,
          submodule: 0.3,
          session: 0.3,
          task: 0.3,
        },
      },
    };

    memory = new HierarchicalMemory(testConfig);
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
    it('should initialize all scopes correctly', async () => {
      const stats = await memory.getStats();

      expect(stats.scopes).toBeGreaterThan(0);
      // Should have: repository + 3 submodules + session = 5 scopes
      expect(stats.scopes).toBe(5);
    });

    it('should create repository scope', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Repository-level pattern',
        metadata: {
          scope: 'repository',
          tags: ['architecture'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      const context = await memory.retrieve('architecture');
      expect(context.artifacts).toHaveLength(1);
      expect(context.artifacts[0].content).toBe('Repository-level pattern');
    });

    it('should create submodule scopes for each submodule', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'SDK pattern',
        metadata: {
          scope: 'submodule',
          submodule: 'sdk',
          tags: ['typescript'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      const context = await memory.retrieve('typescript');
      expect(context.artifacts).toHaveLength(1);
      expect(context.artifacts[0].metadata.submodule).toBe('sdk');
    });
  });

  describe('artifact storage', () => {
    it('should store artifact in repository scope', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test pattern',
        metadata: {
          scope: 'repository',
          tags: ['test'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      const context = await memory.retrieve('test');
      expect(context.artifacts).toHaveLength(1);
    });

    it('should store artifact in submodule scope', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'code_diff',
        content: 'JUCE backend fix',
        metadata: {
          scope: 'submodule',
          submodule: 'juce_backend',
          tags: ['fix', 'ci'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      const context = await memory.retrieve('ci');
      expect(context.artifacts).toHaveLength(1);
      expect(context.artifacts[0].metadata.submodule).toBe('juce_backend');
    });

    it('should store artifact in session scope', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'conversation',
        content: 'Session discussion',
        metadata: {
          scope: 'session',
          tags: ['discussion'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      const context = await memory.retrieve('discussion');
      expect(context.artifacts).toHaveLength(1);
    });

    it('should reject artifact for wrong submodule', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Wrong artifact',
        metadata: {
          scope: 'submodule',
          submodule: 'wrong_submodule', // Not in config
          tags: [],
        },
        timestamp: new Date(),
      };

      await expect(memory.store(artifact)).rejects.toThrow();
    });
  });

  describe('context retrieval', () => {
    beforeEach(async () => {
      // Store test artifacts
      const artifacts: Artifact[] = [
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'Repository pattern: Use TypeScript strict mode',
          metadata: {
            scope: 'repository',
            confidence: 0.9,
            tags: ['typescript', 'best-practice'],
          },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'pattern',
          content: 'SDK pattern: Use Vitest for testing',
          metadata: {
            scope: 'submodule',
            submodule: 'sdk',
            confidence: 0.8,
            tags: ['testing', 'vitest'],
          },
          timestamp: new Date(),
        },
        {
          id: randomUUID(),
          type: 'error_message',
          content: 'JUCE CI error: Python version mismatch',
          metadata: {
            scope: 'submodule',
            submodule: 'juce_backend',
            confidence: 0.7,
            tags: ['ci', 'python', 'error'],
          },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await memory.store(artifact);
      }
    });

    it('should retrieve artifacts by keyword', async () => {
      const context = await memory.retrieve('typescript');
      expect(context.artifacts.length).toBeGreaterThan(0);
      expect(context.artifacts.some(a => a.content.includes('TypeScript'))).toBe(true);
    });

    it('should merge artifacts from multiple scopes', async () => {
      const context = await memory.retrieve('pattern');
      expect(context.artifacts.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect compression budget', async () => {
      const context = await memory.retrieve('pattern');
      expect(context.totalTokens).toBeLessThanOrEqual(testConfig.compression!.targetTokens);
    });

    it('should provide scope breakdown', async () => {
      const context = await memory.retrieve('pattern');
      expect(context.scopes).toBeDefined();
      expect(Object.keys(context.scopes).length).toBeGreaterThan(0);
    });

    it('should calculate compression ratio', async () => {
      const context = await memory.retrieve('pattern');
      expect(context.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(context.compressionRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('task scope management', () => {
    it('should create task scope', async () => {
      const taskId = 'bd-123';
      const taskContext = {
        title: 'Fix JUCE CI',
        description: 'Fix Python version in GitHub Actions',
      };

      await memory.createTaskScope(taskId, taskContext);

      const stats = await memory.getStats();
      expect(stats.scopes).toBe(6); // 5 initial + 1 task scope
    });

    it('should inject relevant notes into task scope', async () => {
      // First store some repository patterns
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'JUCE backend requires Python 3.10+',
        metadata: {
          scope: 'submodule',
          submodule: 'juce_backend',
          confidence: 0.9,
          tags: ['python', 'ci', 'juce'],
        },
        timestamp: new Date(),
      };

      await memory.store(artifact);

      // Create task scope
      const taskId = 'bd-456';
      const taskContext = {
        title: 'Fix JUCE Python CI',
        description: 'Update Python version in GitHub Actions workflow',
      };

      await memory.createTaskScope(taskId, taskContext);

      // Retrieve from task scope
      const context = await memory.retrieve('Python CI', `task:${taskId}`);
      expect(context.artifacts.length).toBeGreaterThan(0);
    });

    it('should reject duplicate task scope creation', async () => {
      const taskId = 'bd-789';
      const taskContext = {
        title: 'Test task',
        description: 'Test description',
      };

      await memory.createTaskScope(taskId, taskContext);

      await expect(
        memory.createTaskScope(taskId, taskContext)
      ).rejects.toThrow();
    });
  });

  describe('statistics', () => {
    it('should return accurate statistics', async () => {
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

      await memory.store(artifact);

      const stats = await memory.getStats();
      expect(stats.scopes).toBeGreaterThan(0);
      expect(stats.artifacts).toBeGreaterThan(0);
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    it('should track artifacts across all scopes', async () => {
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
          metadata: {
            scope: 'submodule',
            submodule: 'sdk',
            tags: [],
          },
          timestamp: new Date(),
        },
      ];

      for (const artifact of artifacts) {
        await memory.store(artifact);
      }

      const stats = await memory.getStats();
      expect(stats.artifacts).toBeGreaterThanOrEqual(2);
    });
  });

  describe('clear operations', () => {
    it('should clear all scopes', async () => {
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

      await memory.store(artifact);
      await memory.clear();

      const stats = await memory.getStats();
      expect(stats.artifacts).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid scope names gracefully', async () => {
      const artifact: Artifact = {
        id: randomUUID(),
        type: 'pattern',
        content: 'Test',
        metadata: {
          scope: 'invalid_scope' as any,
          tags: [],
        },
        timestamp: new Date(),
      };

      await expect(memory.store(artifact)).rejects.toThrow();
    });

    it('should handle empty retrieval queries', async () => {
      const context = await memory.retrieve('');
      expect(context.artifacts).toBeDefined();
    });

    it('should handle queries with no matches', async () => {
      const context = await memory.retrieve('nonexistent_query_xyz123');
      expect(context.artifacts).toBeDefined();
      expect(context.artifacts.length).toBe(0);
    });
  });
});
