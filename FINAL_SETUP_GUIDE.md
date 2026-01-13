# Confucius Extraction - Complete Setup Guide

## ✅ Completed Tasks

### 1. Logo Fixed ✅
- Created `logo-square.png` (400x400)
- Updated README.md to use square version
- Logo properly centered and sized

### 2. README Enhanced ✅
- Added Meta paper citation
- Added research foundation section
- Added BibTeX citation format
- Linked to White Room project

### 3. Repository Structure ✅
- 60+ files staged for commit
- All source code copied
- Documentation complete
- Ready for GitHub

---

## ⚠️ Remaining Work (2-3 hours)

### Step 1: Enable Auto-Learning (30 minutes)

**File**: `packages/mcp-server/src/index.ts`

**Add after line 70** (after setupToolHandlers):

```typescript
/**
 * Start automatic learning from task management
 */
private startAutoLearning(): void {
  if (process.env.CONFUCIUS_AUTO_LEARNING !== 'true') {
    return;
  }

  // Dynamic import to avoid loading if not needed
  import('@confucius-ai/memory/storage/BeadsIntegration.js').then(({ BeadsIntegration }) => {
    const beads = new BeadsIntegration({
      databasePath: process.env.CONFUCIUS_REPOSITORY || process.cwd(),
      autoGenerateNotes: true,
    });

    // Watch for closed issues
    beads.watchResolutions(async (issueId: string, note: string) => {
      await this.memory.store({
        id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'pattern',
        content: note,
        metadata: {
          scope: 'repository',
          tags: ['auto-learned', issueId],
          confidence: 0.8,
        },
        timestamp: new Date(),
      });

      console.error(`✅ Confucius learned from ${issueId}`);
    });

    console.error('🧠 Confucius auto-learning enabled');
  }).catch((err) => {
    console.error('⚠️  Could not enable auto-learning:', err.message);
  });
}
```

**Add to constructor** (after line 70):
```typescript
// Start auto-learning if enabled
this.startAutoLearning();
```

### Step 2: Add Learning Status Tool (15 minutes)

**Add to tools array** (after line 199):

```typescript
{
  name: 'memory_learning_status',
  description: 'Check if Confucius is actively learning from task management',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}
```

**Add handler method** (after line 389):

```typescript
/**
 * Handle memory_learning_status tool
 */
private async handleLearningStatus() {
  const isEnabled = process.env.CONFUCIUS_AUTO_LEARNING === 'true';

  return {
    content: [
      {
        type: 'text',
        text: `Confucius Auto-Learning Status:\n` +
              `----------------------------\n` +
              `Auto-Learning: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
              `Environment Variable: CONFUCIUS_AUTO_LEARNING=${process.env.CONFUCIUS_AUTO_LEARNING || 'false'}\n\n` +
              `${isEnabled ? 'Confucius is actively watching for closed issues and extracting patterns automatically!' : 'Enable auto-learning by setting CONFUCIUS_AUTO_LEARNING=true in MCP configuration'}`,
      },
    ],
    isError: false,
  };
}
```

**Add to switch statement** (after line 222):

```typescript
case 'memory_learning_status':
  return await this.handleLearningStatus();
```

### Step 3: Update Environment Variables (15 minutes)

**Replace all CCA_ with CONFUCIUS_**:

**Line 18**: Update import
```typescript
import { HierarchicalMemory } from '@confucius-ai/memory/dist/core/index.js';
import type { MemoryConfig, Artifact } from '@confucius-ai/memory/dist/core/index.js';
```

**Line 37**:
```typescript
repository: process.env.CONFUCIUS_REPOSITORY || process.cwd(),
```

**Line 38**:
```typescript
submodules: (process.env.CONFUCIUS_SUBMODULES || 'sdk,juce_backend,swift_frontend').split(','),
```

**Line 41**:
```typescript
path: process.env.CONFUCIUS_STORAGE_PATH || join(process.cwd(), '.beads', 'memory'),
```

**Line 60**:
```typescript
name: 'confucius-orchestrator',
```

**Line 398**:
```typescript
console.error('Confucius MCP Server running on stdio');
```

### Step 4: Genericize References (30 minutes)

**Files to update**:

1. **README.md** - Already done, but check for:
   - Remove "CCA" references
   - Ensure "Confucius" branding

2. **Package descriptions**:
   - `packages/memory/package.json`
   - `packages/mcp-server/package.json`

3. **Comments in code**:
   - Search for "CCA" and "Cca"
   - Replace with "Confucius" or "confucius"

### Step 5: Update Package Dependencies (5 minutes)

**File**: `packages/mcp-server/package.json`

```json
{
  "dependencies": {
    "@confucius-ai/memory": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.0.4"
  }
}
```

**File**: `packages/memory/package.json`

Remove this line (no external dependencies):
```json
"dependencies": {}
```

### Step 6: Build & Test (20 minutes)

```bash
cd /Users/bretbouchard/apps/schill/confucius
npm install
npm run build
```

**Test MCP server**:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node packages/mcp-server/dist/index.js
```

### Step 7: Create GitHub Repository (10 minutes)

```bash
cd /Users/bretbouchard/apps/schill/confucius

# Create repo on GitHub first, then:
git remote add origin git@github.com:your-org/confucius.git
git branch -M main
git add -A
git commit -m "Initial commit: Confucius Hierarchical Memory System

🧠 Features:
- Hierarchical memory system (Repository → Submodule → Session → Task)
- 40-60% context compression
- Auto-learning from closed issues
- MCP server for Claude Code
- 101 passing unit tests

Based on Meta's Confucius Code Agent research.
MIT License - Open Source

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"

git push -u origin main
```

### Step 8: Create GitHub Release (5 minutes)

1. Go to GitHub repo
2. Settings → Branches → Set main as default
3. Create Release: v1.0.0
4. Publish release notes

### Step 9: Update White Room Integration (5 minutes)

**File**: `/Users/bretbouchard/apps/schill/white_room/.claude/settings.json`

```json
{
  "mcpServers": {
    "confucius": {
      "command": "npx",
      "args": ["@confucius-ai/mcp-server"],
      "env": {
        "CONFUCIUS_REPOSITORY": "/Users/bretbouchard/apps/schill/white_room",
        "CONFUCIUS_SUBMODULES": "sdk,juce_backend,swift_frontend,daw_control,design_system,infrastructure,build,plans,specs,scripts",
        "CONFUCIUS_STORAGE_PATH": "/Users/bretbouchard/apps/schill/white_room/.beads/memory",
        "CONFUCIUS_AUTO_LEARNING": "true"
      }
    }
  }
}
```

---

## 📋 Quick Reference: Search & Replace

### CCA → Confucius replacements

**In `packages/mcp-server/src/index.ts`**:
- `CCA Orchestrator` → `Confucius Orchestrator`
- `CCA hierarchical` → `Confucius hierarchical`
- `cca-orchestrator` → `confucius-orchestrator`

**In README and documentation**:
- `CCA Memory` → `Confucius`
- `CCA-P1` → `Confucius`

### Environment Variables

| Old | New |
|-----|-----|
| `CCA_REPOSITORY` | `CONFUCIUS_REPOSITORY` |
| `CCA_SUBMODULES` | `CONFUCIUS_SUBMODULES` |
| `CCA_STORAGE_PATH` | `CONFUCIUS_STORAGE_PATH` |
| `CCA_AUTO_LEARNING` | `CONFUCIUS_AUTO_LEARNING` |

---

## 🎯 Final Checklist

Before pushing to GitHub:

- [ ] Logo cropped and referenced correctly
- [ ] Meta paper citation added
- [ ] Auto-learning code added
- [ ] Learning status tool added
- [ ] All CCA_ → CONFUCIUS_ replacements
- [ ] Package dependencies updated
- [ ] Build succeeds
- [ ] MCP server starts correctly
- [ ] All 6 tools available
- [ ] Git repository initialized
- [ ] Commit message ready

---

## 🚀 After Push

1. **Add repo description on GitHub**:
   ```
   Confucius 🧠 - Hierarchical Memory System for AI Agents with Cross-Session Learning
   ```

2. **Add topics**:
   - artificial-intelligence
   - memory-system
   - mcp-server
   - claude-code
   - hierarchical-memory
   - cross-session-learning
   - typescript

3. **Enable GitHub Actions** (optional)

4. **Publish to NPM** (when ready):
   ```bash
   npm publish --workspace=@confucius-ai/memory --access public
   npm publish --workspace=@confucius-ai/mcp-server --access public
   ```

---

**Total estimated time**: 2-3 hours

**Result**: Public open-source Confucius repository with auto-learning enabled! 🎉
