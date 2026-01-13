/**
 * BeadsIntegration - Integration with Beads task management
 */

import type { BeadsConfig } from './types.js';
import type { Artifact } from '../core/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Beads issue data structure
 */
export interface BeadsIssue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed' | 'in_progress' | 'blocked';
  priority: number;
  issue_type: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  labels: string[];
  dependencies?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

/**
 * Beads integration for automatic task scope management
 */
export class BeadsIntegration {
  private config: BeadsConfig;

  constructor(config: BeadsConfig) {
    this.config = config;
  }

  /**
   * Get issue from Beads
   */
  async getIssue(issueId: string): Promise<BeadsIssue> {
    try {
      const { stdout } = await execAsync(
        `bd show ${issueId} --json`,
        { cwd: this.config.databasePath }
      );

      const issues = JSON.parse(stdout) as BeadsIssue[];
      if (issues.length === 0) {
        throw new Error(`Issue not found: ${issueId}`);
      }

      return issues[0];
    } catch (error) {
      throw new Error(`Failed to get issue ${issueId}: ${error}`);
    }
  }

  /**
   * List all issues from Beads
   */
  async listIssues(): Promise<BeadsIssue[]> {
    try {
      const { stdout } = await execAsync(
        `bd list --json`,
        { cwd: this.config.databasePath }
      );

      // Try parsing as a single JSON array first
      try {
        const issues = JSON.parse(stdout) as BeadsIssue[];
        // Validate that it's an array
        if (Array.isArray(issues)) {
          return issues.filter((issue) => issue && issue.id && issue.title);
        }
      } catch {
        // Not a single JSON array, fall back to line-by-line parsing
      }

      // Line-by-line parsing (for compatibility)
      const lines = stdout.trim().split('\n');
      const issues: BeadsIssue[] = [];

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line) as BeadsIssue;
            // Validate that it's a proper issue object
            if (parsed && parsed.id && parsed.title) {
              issues.push(parsed);
            }
          } catch {
            // Skip invalid JSON lines
            continue;
          }
        }
      }

      return issues;
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  /**
   * Get ready issues (no blockers, open or in-progress)
   */
  async getReadyIssues(): Promise<BeadsIssue[]> {
    try {
      const { stdout } = await execAsync(
        `bd ready --json`,
        { cwd: this.config.databasePath }
      );

      const lines = stdout.trim().split('\n');
      const issues: BeadsIssue[] = [];

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line) as BeadsIssue;
            issues.push(parsed);
          } catch {
            // Skip invalid JSON lines
            continue;
          }
        }
      }

      return issues;
    } catch (error) {
      throw new Error(`Failed to get ready issues: ${error}`);
    }
  }

  /**
   * Create note for resolved issue
   */
  async createNote(issueId: string, note: string): Promise<void> {
    const artifact: Artifact = {
      id: `note-${issueId}-${Date.now()}`,
      type: 'pattern',
      content: note,
      metadata: {
        scope: 'repository',
        taskId: issueId,
        tags: ['learned-pattern', 'beads-resolution'],
        confidence: 0.8,
      },
      timestamp: new Date(),
    };

    // Store in memory system (would be injected in production)
    console.log(`[BeadsIntegration] Created note for issue ${issueId}:`, note.substring(0, 100) + '...');
  }

  /**
   * Extract patterns from resolved issues
   */
  async extractPatterns(issueId: string): Promise<string[]> {
    const issue = await this.getIssue(issueId);
    const patterns: string[] = [];

    // Extract patterns from issue description and solution
    if (issue.description) {
      patterns.push(...this.extractPatternsFromText(issue.description));
    }

    return patterns;
  }

  /**
   * Extract patterns from text
   */
  private extractPatternsFromText(text: string): string[] {
    const patterns: string[] = [];

    // Look for common patterns
    const patternRegexes = [
      /fix[:\s]+(.+)$/gim,
      /solution[:\s]+(.+)$/gim,
      /resolved by[:\s]+(.+)$/gim,
      /approach[:\s]+(.+)$/gim,
      /implementation[:\s]+(.+)$/gim,
    ];

    for (const regex of patternRegexes) {
      const matches = text.matchAll(regex);
      for (const match of matches) {
        if (match[1]) {
          patterns.push(match[1].trim());
        }
      }
    }

    return patterns;
  }

  /**
   * Generate structured note from resolved issue
   */
  async generateNoteFromIssue(issueId: string): Promise<string> {
    const issue = await this.getIssue(issueId);
    const patterns = await this.extractPatterns(issueId);

    const note = `# Note: ${issue.title}

**Issue:** ${issueId}
**Repository:** white_room
**Generated:** ${new Date().toISOString()}
**Confidence:** High (${patterns.length} occurrences)

## Problem Pattern
${this.extractProblemPattern(issue)}

## Solution Strategy
${this.extractSolutionPattern(issue)}

## Implementation Details
${this.extractImplementationPattern(issue)}

## Related Issues
${issue.dependencies?.map(d => `- ${d.id}: ${d.title}`).join('\n') || 'None'}

## Tags
${issue.labels.join(', ')}

---
*Note generated automatically from resolved Beads issue*
`;

    return note;
  }

  /**
   * Extract problem pattern from issue
   */
  private extractProblemPattern(issue: BeadsIssue): string {
    const description = issue.description || '';

    // Look for problem/error descriptions
    const problemPatterns = [
      /error[:\s]+(.+?)\n/gim,
      /problem[:\s]+(.+?)\n/gim,
      /issue[:\s]+(.+?)\n/gim,
      /bug[:\s]+(.+?)\n/gim,
    ];

    for (const regex of problemPatterns) {
      const match = description.match(regex);
      if (match && match[1]) {
        return `- ${match[1].trim()}`;
      }
    }

    return '- See issue description for details';
  }

  /**
   * Extract solution pattern from issue
   */
  private extractSolutionPattern(issue: BeadsIssue): string {
    const description = issue.description || '';
    const strategies: string[] = [];

    // Look for solution approaches
    const lines = description.split('\n');
    let inSolution = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.match(/^(solution|fix|approach|resolution)[:\s]/i)) {
        inSolution = true;
        continue;
      }

      if (inSolution && trimmed.startsWith('-')) {
        strategies.push(trimmed);
      } else if (inSolution && trimmed.match(/^\d+\./)) {
        strategies.push(trimmed);
      } else if (inSolution && trimmed === '') {
        break;
      }
    }

    return strategies.length > 0
      ? strategies.map(s => `${s}`).join('\n')
      : '1. Implemented solution per issue description';
  }

  /**
   * Extract implementation pattern from issue
   */
  private extractImplementationPattern(issue: BeadsIssue): string {
    const description = issue.description || '';

    // Look for implementation details
    const implPatterns = [
      /implementation[:\s]+(.+?)\n/gim,
      /code[:\s]+(.+?)\n/gim,
      /changes[:\s]+(.+?)\n/gim,
    ];

    for (const regex of implPatterns) {
      const match = description.match(regex);
      if (match && match[1]) {
        return `- ${match[1].trim()}`;
      }
    }

    return '- See issue description for implementation details';
  }

  /**
   * Watch for issue resolution events
   */
  watchResolutions(callback: (issueId: string, note: string) => void): () => void {
    // Poll for newly closed issues
    const checkInterval = 60000; // 1 minute
    const knownClosedIssues = new Set<string>();

    // Get initial set of closed issues
    const initialize = async () => {
      try {
        const issues = await this.listIssues();
        for (const issue of issues) {
          if (issue.status === 'closed') {
            knownClosedIssues.add(issue.id);
          }
        }
      } catch {
        // Ignore errors on initial scan
      }
    };

    // Initialize synchronously
    initialize();

    // Start polling
    const interval = setInterval(async () => {
      try {
        const issues = await this.listIssues();

        for (const issue of issues) {
          if (issue.status === 'closed' && !knownClosedIssues.has(issue.id)) {
            // New closed issue!
            knownClosedIssues.add(issue.id);

            // Generate note
            const note = await this.generateNoteFromIssue(issue.id);

            // Call callback
            callback(issue.id, note);
          }
        }
      } catch (error) {
        console.error('[BeadsIntegration] Error checking for resolutions:', error);
      }
    }, checkInterval);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Search issues by keyword
   */
  async searchIssues(query: string): Promise<BeadsIssue[]> {
    const issues = await this.listIssues();
    const queryLower = query.toLowerCase();

    return issues.filter((issue) => {
      if (!issue) return false;

      const title = (issue.title || '').toLowerCase();
      const description = (issue.description || '').toLowerCase();
      const labels = (issue.labels || []).join(' ').toLowerCase();

      return (
        title.includes(queryLower) ||
        description.includes(queryLower) ||
        labels.includes(queryLower)
      );
    });
  }

  /**
   * Get issues by label
   */
  async getIssuesByLabel(label: string): Promise<BeadsIssue[]> {
    const issues = await this.listIssues();

    return issues.filter((issue) =>
      issue && issue.labels && issue.labels.includes(label)
    );
  }

  /**
   * Get issue statistics
   */
  async getStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    in_progress: number;
    blocked: number;
  }> {
    const issues = await this.listIssues();

    return {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      closed: issues.filter(i => i.status === 'closed').length,
      in_progress: issues.filter(i => i.status === 'in_progress').length,
      blocked: issues.filter(i => i.status === 'blocked').length,
    };
  }
}
