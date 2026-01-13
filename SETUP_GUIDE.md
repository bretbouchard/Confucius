# Confucius Repository Setup Guide

## 🎯 Overview

This document outlines the **complete extraction plan** for creating a public Confucius repository with auto-learning features enabled.

## ✅ What's Been Done

### 1. Repository Structure Created
```
/Users/bretbouchard/apps/schill/confucius/
├── package.json (root workspace)
├── LICENSE (MIT)
├── README.md (public-friendly)
├── CONTRIBUTING.md
├── packages/
│   ├── memory/ (source code copied)
│   └── mcp-server/ (source code copied)
└── docs/
```

### 2. Files Created
- ✅ Root package.json with workspace configuration
- ✅ MIT License for open source
- ✅ Comprehensive README.md
- ✅ Contributing guidelines
- ✅ Memory package.json (@confucius-ai/memory)
- ✅ MCP Server package.json (@confucius-ai/mcp-server)
- ✅ Source code copied from white_room

## ⚠️ What Still Needs To Be Done

### High Priority (For Auto-Learning)

#### 1. Update MCP Server to Enable Auto-Learning
**File**: `packages/mcp-server/src/index.ts`

**Add to constructor** (after line 57):
```typescript
// Enable auto-learning from task management
if (process.env.CONFUCIUS_AUTO_LEARNING === 'true') {
  this.startAutoLearning();
}
```

**Add method** (after line 70):
```typescript
/**
 * Start automatic learning from closed issues
 */
private startAutoLearning(): void {
  const TaskManagementIntegration = require('@confucius-ai/memory/integrations').TaskManagementIntegration;

  const tm = new TaskManagementIntegration({
    databasePath: process.env.CONFUCIUS_REPOSITORY || process.cwd(),
    autoGenerateNotes: true,
  });

  // Watch for closed issues/tasks
  tm.watchResolutions(async (issueId: string, note: string) => {
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
}
```

#### 2. Add New Tool: Learning Status
**Add to tools array** (around line 199):
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

**Add handler** (after line 388):
```typescript
private async handleLearningStatus() {
  const isEnabled = process.env.CONFUCIUS_AUTO_LEARNING === 'true';

  return {
    content: [{
      type: 'text',
      text: `Confucius Auto-Learning Status:\n` +
            `----------------------------\n` +
            `Auto-Learning: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n` +
            `Environment Variable: CONFUCIUS_AUTO_LEARNING=${process.env.CONFUCIUS_AUTO_LEARNING || 'false'}\n\n` +
            `${isEnabled ? 'Confucius is actively watching for closed issues and extracting patterns automatically!' : 'Enable auto-learning by setting CONFUCIUS_AUTO_LEARNING=true in MCP configuration'}`
    }],
    isError: false,
  };
}
```

#### 3. Add Tool Handler Case
**Add to switch statement** (after line 222):
```typescript
case 'memory_learning_status':
  return await this.handleLearningStatus();
```

#### 4. Update Environment Variable Names
**Search and replace** in `packages/mcp-server/src/index.ts`:
- `CCA_REPOSITORY` → `CONFUCIUS_REPOSITORY`
- `CCA_SUBMODULES` → `CONFUCIUS_SUBMODULES`
- `CCA_STORAGE_PATH` → `CONFUCIUS_STORAGE_PATH`

### Medium Priority (For Genericization)

#### 5. Remove White Room-Specific References
**Files to update**:
- `packages/memory/README.md` - Remove "White Room" mentions
- `packages/memory/package.json` - Update description
- All code comments - Make generic

#### 6. Create Integrations Module
**Create**: `packages/memory/src/integrations/index.ts`
```typescript
export { TaskManagementIntegration } from './TaskManagementIntegration.js';
export { BeadsIntegration } from './BeadsIntegration.js';
```

**Create**: `packages/memory/src/integrations/TaskManagementIntegration.ts`
```typescript
/**
 * Generic task management integration
 * Works with Beads, GitHub Issues, JIRA, etc.
 */

export class TaskManagementIntegration {
  // Move BeadsIntegration code here and make it generic
}
```

#### 7. Update Package Exports
**File**: `packages/memory/package.json`

**Add to exports**:
```json
"./integrations": {
  "import": "./dist/integrations/index.js",
  "types": "./dist/integrations/index.d.ts"
}
```

### Low Priority (For Polish)

#### 8. Add .gitignore
```bash
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
```

#### 9. Add GitHub Templates
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

#### 10. Add CI/CD
- `.github/workflows/test.yml`
- `.github/workflows/release.yml`

## 🚀 Quick Start (Manual Setup)

If you want to test Confucius NOW in white_room:

### Step 1: Build Confucius
```bash
cd /Users/bretbouchard/apps/schill/confucius
npm install
npm run build
```

### Step 2: Update White Room to Use Confucius
**File**: `/Users/bretbouchard/apps/schill/white_room/package.json`

**Add dependency**:
```json
{
  "dependencies": {
    "confucius": "file:../confucius"
  }
}
```

### Step 3: Update MCP Configuration
**File**: `/Users/bretbouchard/apps/schill/white_room/.claude/settings.json`

```json
{
  "mcpServers": {
    "confucius": {
      "command": "node",
      "args": ["/Users/bretbouchard/apps/schill/confucius/packages/mcp-server/dist/index.js"],
      "env": {
        "CONFUCIUS_REPOSITORY": "/Users/bretbouchard/apps/schill/white_room",
        "CONFUCIUS_SUBMODULES": "sdk,juce_backend,swift_frontend,daw_control,design_system,infrastructure",
        "CONFUCIUS_STORAGE_PATH": "/Users/bretbouchard/apps/schill/white_room/.beads/memory",
        "CONFUCIUS_AUTO_LEARNING": "true"
      }
    }
  }
}
```

### Step 4: Test
```bash
# Restart Claude Code
# Look for "confucius" in MCP server list
# Try: memory_learning_status
```

## 📊 Auto-Learning Features

Once enabled, Confucius will:

1. **Watch for closed bd issues** (every 60 seconds)
2. **Extract patterns** automatically
3. **Generate structured notes**
4. **Store in repository scope** with confidence 0.8
5. **Log each learning event** to console

**Example auto-generated note**:
```markdown
# Note: CCA-P1-T006: Write Comprehensive Unit Tests

**Issue:** white_room-169
**Confidence:** High (23 occurrences)

## Problem Pattern
- Need to ensure comprehensive test coverage
- Must test all memory system components
- Quality assurance requirement

## Solution Strategy
- Test HierarchicalMemory class operations
- Test scope-specific operations
- Test context compression engine
- Test artifact storage and retrieval
- Integration tests with Beads

## Implementation Notes
- See issue description for implementation details
```

## 🎯 Next Steps

1. **Complete High Priority tasks** (1-2 hours)
   - Add auto-learning to MCP server
   - Add learning status tool
   - Update environment variable names

2. **Build and test** (30 minutes)
   - `npm run build`
   - Test MCP server startup
   - Verify auto-learning works

3. **Create GitHub repo** (15 minutes)
   - Create `github.com/your-org/confucius`
   - Push code
   - Add description and topics

4. **Publish to NPM** (30 minutes)
   - `npm publish --workspace=@confucius-ai/memory`
   - `npm publish --workspace=@confucius-ai/mcp-server`

5. **Update White Room** (15 minutes)
   - Install from npm instead of local
   - Update imports
   - Test integration

## 🔒 Privacy Guarantee

**Your data stays in White Room!**
- Confucius CODE is public (GitHub)
- Your PATTERNS stay private (.beads/memory/)
- Your LEARNINGS never leave your project
- Only the TOOL is shared, not your DATA

---

**Total Time Estimate**: 3-4 hours to complete extraction and enable auto-learning
