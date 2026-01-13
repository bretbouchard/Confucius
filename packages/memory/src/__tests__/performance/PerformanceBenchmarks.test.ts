/**
 * Performance Benchmarks for CCA Memory System
 *
 * Tests memory operations, compression, and retrieval performance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HierarchicalMemory } from '../../core/HierarchicalMemory.js';
import type { MemoryConfig, Artifact } from '../../core/types.js';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

interface PerformanceMetrics {
  operation: string;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSecond: number;
  sampleSize: number;
}

describe('CCA Performance Benchmarks', () => {
  let memory: HierarchicalMemory;
  let testConfig: MemoryConfig;
  let testStorageDir: string;

  beforeAll(async () => {
    testStorageDir = join(process.cwd(), '.beads', 'memory-bench');
    await fs.rm(testStorageDir, { recursive: true, force: true });

    testConfig = {
      repository: process.cwd(),
      submodules: ['sdk', 'juce_backend', 'swift_frontend'],
      storage: {
        backend: 'filesystem',
        path: testStorageDir,
        maxSize: 1000,
        retentionDays: 90,
      },
      compression: {
        targetTokens: 100000,
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

  afterAll(async () => {
    await fs.rm(testStorageDir, { recursive: true, force: true });
  });

  describe('Memory Storage Performance', () => {
    it('should store 1000 artifacts in under 5 seconds', async () => {
      const artifacts: Artifact[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'pattern',
          content: `Pattern ${i}: This is a test pattern for benchmarking storage performance. It contains some repeated text to simulate real usage patterns.`,
          metadata: {
            scope: 'repository',
            tags: ['benchmark', 'test'],
            confidence: 0.8,
          },
          timestamp: new Date(),
        };
        artifacts.push(artifact);
        await memory.store(artifact);
      }

      const elapsed = Date.now() - startTime;

      console.log(`✓ Stored 1000 artifacts in ${elapsed}ms (${(elapsed / 1000).toFixed(2)}ms per artifact)`);
      expect(elapsed).toBeLessThan(5000);
    });

    it('should achieve target storage throughput', async () => {
      const operations = 500;
      const startTime = Date.now();

      for (let i = 0; i < operations; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'error_message',
          content: `Error ${i}: Test error message for performance measurement`,
          metadata: {
            scope: 'task',
            taskId: `task-${i % 10}`,
            tags: ['error', 'benchmark'],
          },
          timestamp: new Date(),
        };
        await memory.store(artifact);
      }

      const elapsed = Date.now() - startTime;
      const opsPerSecond = (operations / elapsed) * 1000;

      console.log(`✓ Storage throughput: ${opsPerSecond.toFixed(2)} ops/sec`);
      expect(opsPerSecond).toBeGreaterThan(100); // At least 100 ops/sec
    });
  });

  describe('Memory Retrieval Performance', () => {
    beforeEach(async () => {
      // Pre-populate with test data
      for (let i = 0; i < 500; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: ['pattern', 'error_message', 'design_decision'][i % 3],
          content: `Artifact ${i}: Content for testing retrieval performance with various keywords and patterns`,
          metadata: {
            scope: ['repository', 'submodule', 'session', 'task'][i % 4],
            submodule: ['sdk', 'juce_backend'][i % 2],
            taskId: `task-${i % 10}`,
            tags: ['test', 'benchmark', 'performance'],
          },
          timestamp: new Date(Date.now() - i * 1000),
        };
        await memory.store(artifact);
      }
    });

    it('should retrieve context in under 100ms', async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const context = await memory.retrieve('test pattern', 'session');
        const elapsed = Date.now() - start;
        times.push(elapsed);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`✓ Retrieval performance:`);
      console.log(`  - Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  - Min: ${minTime}ms`);
      console.log(`  - Max: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });

    it('should handle concurrent retrieval efficiently', async () => {
      const concurrent = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrent }, async (_, i) => {
        return memory.retrieve(`query ${i % 10}`, 'repository');
      });

      await Promise.all(promises);

      const elapsed = Date.now() - startTime;
      const avgTime = elapsed / concurrent;

      console.log(`✓ Concurrent retrieval: ${concurrent} queries in ${elapsed}ms (${avgTime.toFixed(2)}ms avg)`);
      expect(avgTime).toBeLessThan(150);
    });
  });

  describe('Compression Performance', () => {
    it('should achieve 40-60% token reduction', async () => {
      // Create large dataset
      const totalArtifacts = 2000;
      for (let i = 0; i < totalArtifacts; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: ['pattern', 'error_message', 'design_decision', 'build_log', 'test_result'][i % 5],
          content: `Artifact ${i}: This is a longer piece of content to simulate real-world usage. `.repeat(10),
          metadata: {
            scope: ['repository', 'submodule', 'session', 'task'][i % 4],
            tags: ['benchmark', 'test', 'compression'],
            confidence: 0.5 + (i % 5) * 0.1,
          },
          timestamp: new Date(Date.now() - i * 1000),
        };
        await memory.store(artifact);
      }

      // Retrieve and check compression
      const context = await memory.retrieve('benchmark test compression', 'repository');
      const totalTokens = context.artifacts.reduce((sum, artifact) => {
        return sum + artifact.content.length / 4; // Rough token estimate
      }, 0);

      const originalEstimate = totalArtifacts * 250; // ~250 tokens per artifact
      const compressionRatio = 1 - (totalTokens / originalEstimate);

      console.log(`✓ Compression performance:`);
      console.log(`  - Original estimate: ${originalEstimate} tokens`);
      console.log(`  - After compression: ${totalTokens.toFixed(0)} tokens`);
      console.log(`  - Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);

      expect(compressionRatio).toBeGreaterThanOrEqual(0.40);
      expect(compressionRatio).toBeLessThanOrEqual(0.60);
    });

    it('should not lose critical information', async () => {
      // Store high-priority artifacts
      const criticalArtifacts: Artifact[] = [];
      for (let i = 0; i < 100; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'pattern',
          content: `CRITICAL_PATTERN_${i}: Important information that must be preserved`,
          metadata: {
            scope: 'repository',
            tags: ['critical', 'important'],
            confidence: 1.0,
          },
          timestamp: new Date(),
        };
        criticalArtifacts.push(artifact);
        await memory.store(artifact);
      }

      // Add many low-priority artifacts to force compression
      for (let i = 0; i < 2000; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'build_log',
          content: `Build log entry ${i} with verbose output that should be compressed`,
          metadata: {
            scope: 'repository',
            tags: ['verbose', 'log'],
            confidence: 0.3,
          },
          timestamp: new Date(Date.now() - i * 1000),
        };
        await memory.store(artifact);
      }

      // Retrieve and verify critical artifacts are present
      const context = await memory.retrieve('CRITICAL_PATTERN', 'repository');
      const criticalIds = new Set(context.artifacts.map(a => a.id));

      const missingCount = criticalArtifacts.filter(a => !criticalIds.has(a.id)).length;

      console.log(`✓ Critical information preservation: ${criticalArtifacts.length - missingCount}/${criticalArtifacts.length} critical artifacts preserved`);

      expect(missingCount).toBe(0);
    });
  });

  describe('Scope Budget Performance', () => {
    it('should respect 10/30/30/30 scope budget allocation', async () => {
      const targetTokens = 10000;

      // Add artifacts to all scopes
      for (let i = 0; i < 500; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'pattern',
          content: `Pattern ${i}: `.repeat(10),
          metadata: {
            scope: ['repository', 'submodule', 'session', 'task'][i % 4],
            submodule: 'sdk',
            taskId: `task-${i % 10}`,
          },
          timestamp: new Date(),
        };
        await memory.store(artifact);
      }

      // Retrieve with different active scopes
      const repositoryContext = await memory.retrieve('test', 'repository');
      const sessionContext = await memory.retrieve('test', 'session');
      const taskContext = await memory.retrieve('test', 'task');

      const repoTokens = repositoryContext.artifacts.reduce((sum, a) => sum + a.content.length / 4, 0);
      const sessionTokens = sessionContext.artifacts.reduce((sum, a) => sum + a.content.length / 4, 0);
      const taskTokens = taskContext.artifacts.reduce((sum, a) => sum + a.content.length / 4, 0);

      console.log(`✓ Scope budget allocation:`);
      console.log(`  - Repository scope: ${repoTokens.toFixed(0)} tokens (${((repoTokens / targetTokens) * 100).toFixed(1)}%)`);
      console.log(`  - Session scope: ${sessionTokens.toFixed(0)} tokens (${((sessionTokens / targetTokens) * 100).toFixed(1)}%)`);
      console.log(`  - Task scope: ${taskTokens.toFixed(0)} tokens (${((taskTokens / targetTokens) * 100).toFixed(1)}%)`);

      // Verify budgets are approximately correct (±10% tolerance)
      expect(repoTokens / targetTokens).toBeGreaterThanOrEqual(0.05);
      expect(repoTokens / targetTokens).toBeLessThanOrEqual(0.15);

      expect(sessionTokens / targetTokens).toBeGreaterThanOrEqual(0.25);
      expect(sessionTokens / targetTokens).toBeLessThanOrEqual(0.35);

      expect(taskTokens / targetTokens).toBeGreaterThanOrEqual(0.25);
      expect(taskTokens / targetTokens).toBeLessThanOrEqual(0.35);
    });
  });

  describe('Memory Usage Analytics', () => {
    it('should track memory usage across operations', async () => {
      const initialStats = await memory.query('repository');

      // Perform operations
      for (let i = 0; i < 100; i++) {
        const artifact: Artifact = {
          id: randomUUID(),
          type: 'pattern',
          content: `Analytics test ${i}: `.repeat(5),
          metadata: {
            scope: 'repository',
            tags: ['analytics'],
          },
          timestamp: new Date(),
        };
        await memory.store(artifact);
      }

      const finalStats = await memory.query('repository');

      const artifactIncrease = finalStats.artifacts - initialStats.artifacts;
      const tokensIncrease = finalStats.totalTokens - initialStats.totalTokens;

      console.log(`✓ Memory usage tracking:`);
      console.log(`  - Artifacts added: ${artifactIncrease}`);
      console.log(`  - Tokens added: ${tokensIncrease.toFixed(0)}`);
      console.log(`  - Final stats:`, finalStats);

      expect(artifactIncrease).toBeGreaterThan(0);
      expect(tokensIncrease).toBeGreaterThan(0);
    });
  });

  describe('Overall Performance Summary', () => {
    it('should meet all performance targets', async () => {
      const metrics: PerformanceMetrics[] = [];

      // Storage performance
      const storageStart = Date.now();
      for (let i = 0; i < 100; i++) {
        await memory.store({
          id: randomUUID(),
          type: 'pattern',
          content: `Summary test ${i}`,
          metadata: { scope: 'repository' },
          timestamp: new Date(),
        });
      }
      const storageTime = Date.now() - storageStart;
      metrics.push({
        operation: 'storage',
        avgTimeMs: storageTime / 100,
        minTimeMs: 0,
        maxTimeMs: storageTime,
        opsPerSecond: (100 / storageTime) * 1000,
        sampleSize: 100,
      });

      // Retrieval performance
      const retrievalTimes: number[] = [];
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await memory.retrieve('summary test', 'repository');
        retrievalTimes.push(Date.now() - start);
      }
      const avgRetrieval = retrievalTimes.reduce((a, b) => a + b, 0) / retrievalTimes.length;
      metrics.push({
        operation: 'retrieval',
        avgTimeMs: avgRetrieval,
        minTimeMs: Math.min(...retrievalTimes),
        maxTimeMs: Math.max(...retrievalTimes),
        opsPerSecond: (50 / avgRetrieval) * 1000,
        sampleSize: 50,
      });

      console.log('\n📊 PERFORMANCE SUMMARY:');
      console.log('═'.repeat(60));
      metrics.forEach(m => {
        console.log(`\n${m.operation.toUpperCase()}:`);
        console.log(`  Average: ${m.avgTimeMs.toFixed(2)}ms`);
        console.log(`  Range: ${m.minTimeMs}ms - ${m.maxTimeMs}ms`);
        console.log(`  Throughput: ${m.opsPerSecond.toFixed(2)} ops/sec`);
        console.log(`  Samples: ${m.sampleSize}`);
      });
      console.log('\n' + '═'.repeat(60));

      // Verify performance targets
      expect(avgRetrieval).toBeLessThan(100);
      expect(metrics[0].opsPerSecond).toBeGreaterThan(100);
    });
  });
});
