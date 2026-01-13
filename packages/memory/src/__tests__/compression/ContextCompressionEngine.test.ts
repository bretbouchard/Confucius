/**
 * ContextCompressionEngine unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextCompressionEngine } from '../../compression/ContextCompressionEngine.js';
import type { CompressionConfig, CompressionOptions } from '../../compression/types.js';
import type { Artifact } from '../../core/types.js';

describe('ContextCompressionEngine', () => {
  let engine: ContextCompressionEngine;
  let config: CompressionConfig;

  beforeEach(() => {
    config = {
      targetTokens: 1000,
      compressionLevel: 0.5,
      scopeBudgets: {
        repository: 0.1,
        submodule: 0.3,
        session: 0.3,
        task: 0.3,
      },
    };
    engine = new ContextCompressionEngine(config);
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      // Engine is initialized, test passes if no error thrown
      expect(engine).toBeDefined();
    });
  });

  describe('compression', () => {
    let testArtifacts: Artifact[];

    beforeEach(() => {
      testArtifacts = [
        {
          id: 'test-1',
          type: 'pattern',
          content: 'A'.repeat(1000), // ~250 tokens
          metadata: {
            scope: 'repository',
            confidence: 0.9,
            tags: ['high-confidence'],
          },
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'test-2',
          type: 'pattern',
          content: 'B'.repeat(1000), // ~250 tokens
          metadata: {
            scope: 'repository',
            confidence: 0.7,
            tags: ['medium-confidence'],
          },
          timestamp: new Date('2024-01-02'),
        },
        {
          id: 'test-3',
          type: 'pattern',
          content: 'C'.repeat(1000), // ~250 tokens
          metadata: {
            scope: 'repository',
            confidence: 0.5,
            tags: ['low-confidence'],
          },
          timestamp: new Date('2024-01-03'),
        },
      ];
    });

    it('should return all artifacts if under budget', async () => {
      const options: CompressionOptions = {
        targetTokens: 10000, // Large budget
      };

      const result = await engine.compress(testArtifacts, options);

      expect(result.artifacts).toHaveLength(3);
      expect(result.ratio).toBe(1.0);
      expect(result.totalTokens).toBeLessThanOrEqual(result.originalTokens);
    });

    it('should compress artifacts to fit budget', async () => {
      const options: CompressionOptions = {
        targetTokens: 300, // Small budget
      };

      const result = await engine.compress(testArtifacts, options);

      expect(result.artifacts.length).toBeLessThan(3);
      expect(result.totalTokens).toBeLessThanOrEqual(options.targetTokens);
    });

    it('should prioritize high-confidence artifacts', async () => {
      const options: CompressionOptions = {
        targetTokens: 300, // Only fits 1 artifact
      };

      const result = await engine.compress(testArtifacts, options);

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts[0].metadata.confidence).toBe(0.9);
    });

    it('should prioritize recent artifacts when confidence ties', async () => {
      // Same confidence, different timestamps, same size
      const artifacts: Artifact[] = [
        {
          id: 'old',
          type: 'pattern',
          content: 'Old artifact with same length',
          metadata: {
            scope: 'repository',
            confidence: 0.8,
            tags: [],
          },
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'new',
          type: 'pattern',
          content: 'New artifact with same length',
          metadata: {
            scope: 'repository',
            confidence: 0.8,
            tags: [],
          },
          timestamp: new Date('2024-01-10'),
        },
      ];

      const options: CompressionOptions = {
        targetTokens: 10, // Very tight budget - only fits one artifact
      };

      const result = await engine.compress(artifacts, options);

      // Should select only one artifact (the newer one due to timestamp)
      expect(result.artifacts.length).toBe(1);
      expect(result.artifacts[0].id).toBe('new');
    });

    it('should calculate compression ratio correctly', async () => {
      const options: CompressionOptions = {
        targetTokens: 300,
      };

      const result = await engine.compress(testArtifacts, options);

      expect(result.ratio).toBeGreaterThanOrEqual(0);
      expect(result.ratio).toBeLessThanOrEqual(1);
      expect(result.ratio).toBe(result.artifacts.length / testArtifacts.length);
    });

    it('should track original token count', async () => {
      const options: CompressionOptions = {
        targetTokens: 300,
      };

      const result = await engine.compress(testArtifacts, options);

      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.originalTokens).toBeGreaterThan(result.totalTokens);
    });
  });

  describe('edge cases', () => {
    it('should handle empty artifact list', async () => {
      const options: CompressionOptions = {
        targetTokens: 1000,
      };

      const result = await engine.compress([], options);

      expect(result.artifacts).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.ratio).toBe(0);
    });

    it('should handle single artifact', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'Single artifact',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      const options: CompressionOptions = {
        targetTokens: 1000,
      };

      const result = await engine.compress([artifact], options);

      expect(result.artifacts).toHaveLength(1);
      expect(result.ratio).toBe(1.0);
    });

    it('should handle very small budget', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'Large artifact',
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      const options: CompressionOptions = {
        targetTokens: 1, // Very small budget
      };

      const result = await engine.compress([artifact], options);

      // Should return empty or very few artifacts
      expect(result.artifacts.length).toBeLessThanOrEqual(1);
    });

    it('should handle artifacts without confidence', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'No confidence',
        metadata: {
          scope: 'repository',
          tags: [],
          // No confidence field
        },
        timestamp: new Date(),
      };

      const options: CompressionOptions = {
        targetTokens: 1000,
      };

      const result = await engine.compress([artifact], options);

      expect(result.artifacts).toHaveLength(1);
    });
  });

  describe('token estimation', () => {
    it('should estimate tokens reasonably', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        type: 'pattern',
        content: 'A'.repeat(100), // ~25 tokens
        metadata: {
          scope: 'repository',
          tags: [],
        },
        timestamp: new Date(),
      };

      const options: CompressionOptions = {
        targetTokens: 1000,
      };

      const result = await engine.compress([artifact], options);

      // Should be approximately 25 tokens (100 / 4)
      expect(result.totalTokens).toBeGreaterThan(20);
      expect(result.totalTokens).toBeLessThan(30);
    });
  });
});
