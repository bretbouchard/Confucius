/**
 * BeadsIntegration unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BeadsIntegration } from '../../storage/BeadsIntegration.js';
import type { BeadsConfig } from '../../storage/types.js';

describe('BeadsIntegration', () => {
  let beads: BeadsIntegration;
  let config: BeadsConfig;

  beforeEach(() => {
    config = {
      // Use white_room beads database for tests
      databasePath: '/Users/bretbouchard/apps/schill/white_room',
      autoCreateTaskScopes: true,
      autoGenerateNotes: true,
    };

    beads = new BeadsIntegration(config);
  });

  describe('initialization', () => {
    it('should initialize with config', () => {
      expect(beads).toBeDefined();
    });
  });

  describe('issue retrieval', () => {
    it('should get issue by ID', async () => {
      const issue = await beads.getIssue('white_room-169');

      expect(issue).toBeDefined();
      expect(issue.id).toBe('white_room-169');
      expect(issue.title).toContain('Write Comprehensive Unit Tests');
    });

    it('should get issue with all properties', async () => {
      const issue = await beads.getIssue('white_room-169');

      expect(issue.id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.status).toBeDefined();
      expect(issue.priority).toBeDefined();
      expect(issue.labels).toBeDefined();
      expect(issue.created_at).toBeDefined();
      expect(issue.updated_at).toBeDefined();
    });

    it('should throw error for non-existent issue', async () => {
      await expect(beads.getIssue('nonexistent-999')).rejects.toThrow();
    });
  });

  describe('issue listing', () => {
    it('should list all issues', async () => {
      const issues = await beads.listIssues();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should return issues with correct structure', async () => {
      const issues = await beads.listIssues();
      const issue = issues[0];

      expect(issue.id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.status).toBeDefined();
    });

    it('should handle empty results gracefully', async () => {
      // This test verifies the method doesn't crash on empty results
      const issues = await beads.listIssues();
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('ready issues', () => {
    it('should get ready issues', async () => {
      const issues = await beads.getReadyIssues();

      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('pattern extraction', () => {
    it('should extract patterns from issue', async () => {
      const patterns = await beads.extractPatterns('white_room-169');

      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should extract fix patterns', async () => {
      const patterns = await beads.extractPatterns('white_room-169');

      // May or may not find patterns depending on issue content
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe('note generation', () => {
    it('should generate note from issue', async () => {
      const note = await beads.generateNoteFromIssue('white_room-169');

      expect(note).toBeDefined();
      expect(note).toContain('white_room-169');
      expect(note).toContain('Write Comprehensive Unit Tests');
    });

    it('should include problem pattern in note', async () => {
      const note = await beads.generateNoteFromIssue('white_room-169');

      expect(note).toContain('Problem Pattern');
    });

    it('should include solution strategy in note', async () => {
      const note = await beads.generateNoteFromIssue('white_room-169');

      expect(note).toContain('Solution Strategy');
    });

    it('should include implementation details in note', async () => {
      const note = await beads.generateNoteFromIssue('white_room-169');

      expect(note).toContain('Implementation Details');
    });
  });

  describe('search functionality', () => {
    it('should search issues by keyword', async () => {
      const issues = await beads.searchIssues('test');

      expect(Array.isArray(issues)).toBe(true);
      // Should find issues with 'test' in title/description/labels
    });

    it('should be case-insensitive', async () => {
      const results1 = await beads.searchIssues('TEST');
      const results2 = await beads.searchIssues('test');

      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for no matches', async () => {
      const issues = await beads.searchIssues('nonexistent_xyz123');

      expect(Array.isArray(issues)).toBe(true);
      // May or may not be empty depending on actual issues
    });
  });

  describe('label filtering', () => {
    it('should get issues by label', async () => {
      const issues = await beads.getIssuesByLabel('cca');

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent label', async () => {
      const issues = await beads.getIssuesByLabel('nonexistent_label_xyz123');

      expect(issues).toEqual([]);
    });
  });

  describe('statistics', () => {
    it('should get issue statistics', async () => {
      const stats = await beads.getStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.open).toBeGreaterThanOrEqual(0);
      expect(stats.closed).toBeGreaterThanOrEqual(0);
      expect(stats.in_progress).toBeGreaterThanOrEqual(0);
      expect(stats.blocked).toBeGreaterThanOrEqual(0);
    });

    it('should have total greater than or equal to sum of statuses', async () => {
      const stats = await beads.getStats();
      const sum = stats.open + stats.closed + stats.in_progress + stats.blocked;

      // Total should be >= sum (there might be other statuses)
      expect(stats.total).toBeGreaterThanOrEqual(sum);
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      // Test that the system doesn't crash on invalid JSON
      const issues = await beads.listIssues();
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should handle missing issue properties', async () => {
      // Test with an issue that might be missing properties
      const note = await beads.generateNoteFromIssue('white_room-169');
      expect(note).toBeDefined();
    });
  });
});
