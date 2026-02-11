# White Room Confucius Integration - Explained

**Updated:** 2025-02-11

## 🎯 The Confusion About "Seeing All Projects"

**Your Question:** "I want white room to see all of the projects inside of itself."

**The Confusion:** You expected to see other projects (like subdirectories or subrepos) within white_room's directory, similar to how schill/confucius contains multiple projects.

## 🔍 The Reality: Schill is a Monorepo

### What Schill Actually Is

```
schill/ (monorepo root)
├── confucius/          ← One project among many
├── white_room/          ← Another project
├── benchmarks/           ← Another project
├── DS_Store/            ← Another project
├── flutter-plugins/     ← Another project
├── dart_tool/           ← Another project
├── kiro/                ← Another project
└── .git/               ← Git submodules (shared)
```

**Each is an INDEPENDENT PROJECT** at the same level, not a "sub-folder" of white_room.

### How Confucius Works (Current Design - CORRECT!)

Confucius MCP server uses this logic:

```typescript
// From confucius/packages/mcp-server/src/index.ts line 36:
repository: process.env.CONFUCIUS_REPOSITORY || process.cwd()
```

**What This Means:**

| Project Active Directory | Confucius Repository Path | What Gets Stored |
|------------------------|----------------------|-------------------|
| **white_room/** | `/Users/bretbouchard/apps/schill/white_room` | Patterns stored in: `.confucius/memory/` scoped as "repository" but actually using **white_room's directory path** |
| **confucius/** | `/Users/bretbouchard/apps/schill/confucius` | Patterns stored in: `.confucius/memory/` scoped as "repository" using **confucius's own directory** |
| **benchmarks/** | `/Users/bretbouchard/apps/schill/benchmarks` | Patterns stored in: `.confucius/memory/` scoped as "repository" using **benchmarks's directory** |
| **DS_Store/** | `/Users/bretbouchard/apps/schill/DS_Store` | Patterns stored in: `.confucius/memory/` scoped as "repository" using **DS_Store's directory** |

**The Magic:** Each project gets **automatic project-specific storage**!

When Confucius stores artifacts, it uses:
```typescript
// From line 393 in index.ts:
await this.memory.store({
  id: crypto.randomUUID(),
  type: 'pattern',
  content: 'Solution: Use PKCE for OAuth2',
  metadata: {
    scope: 'repository',  // ← Uses process.cwd() which = current project!
    tags: ['oauth2', 'pkce'],
    confidence: 1.0,
  },
  timestamp: new Date(),
});
```

### Example: white_room Development

When you work in white_room:
```bash
cd /Users/bretbouchard/apps/schill/white_room
# Confucius in white_room will use:
# - Repository: /Users/bretbouchard/apps/schill/white_room
# - Storage: /Users/bretbouchard/apps/schill/white_room/.confucius/memory
# - So patterns are stored in white_room's repository scope, NOT confucius's
```

When you store "Use PKCE for OAuth2" from white_room:
- ✅ Stored in: `/Users/bretbouchard/apps/schill/white_room/.confucius/memory/repository/`
- ✅ Scoped as: `repository`
- ✅ Available to white_room's future work

When you work in confucius project:
```bash
cd /Users/bretbouchard/apps/schill/confucius
# Confucius in confucius project will use:
# - Repository: /Users/bretbouchard/apps/schill/confucius
# - Storage: /Users/bretbouchard/apps/schill/confucius/.confucius/memory
# - So patterns are stored in confucius's repository scope
```

When you store "Implement JWT auth" from confucius project:
- ✅ Stored in: `/Users/bretbouchard/apps/schill/confucius/.confucius/memory/repository/`
- ✅ Scoped as: `repository`
- ✅ Available to confucius project's future work

### Why This Design is Brilliant ✨

**1. Automatic Project-Specific Storage**
- No manual configuration needed per project
- Uses `process.cwd()` automatically
- Each project gets isolated memory at its own path
- **Repository scope** = each project's root directory

**2. Pattern Sharing (If Enabled)**
- white_room patterns available in confucius project's repository scope
- confucius patterns available in white_room's repository scope
- **Cross-pollination** - Each project learns from others' successes!

**3. Clear Ownership**
- Each project maintains its own knowledge base
- No cross-project contamination
- Focused context per project

### The Key Insight

> "Does this also see as sub folder / sub repos?"

**Answer:** Each project is a **peer project** in the monorepo, not a sub-folder. They all have:
- Their own `.git/` folder
- Their own build systems
- Their own independent lifecycles
- Their own documentation

**Confucius doesn't need to "see sub folders"** - it already provides:
- Repository-level scoping (each project = repository)
- Project-specific automatic storage
- Cross-project learning (when shared repository scope enabled)

## 📊 What You're Seeing Now

**When you use `memory_retrieve` or `memory_retrieve_successes` in white_room:**
```bash
# Querying white_room's repository scope
# Will return patterns from: /Users/bretbouchard/apps/schill/white_room/.confucius/memory/repository/
```

**When you use same tools in confucius project:**
```bash
# Querying confucius's repository scope
# Will return patterns from: /Users/bretbouchard/apps/schill/confucius/.confucius/memory/repository/
```

**Each project uses its own directory as repository!** This means:
- Each project = one "repository" in Confucius terms
- Automatic project-specific storage
- No cross-project pattern contamination
- Clear ownership and focused context

### 🎯 Benefits of This Architecture

1. ✅ **No Cross-Contamination** - white_room patterns don't leak into other projects
2. ✅ **Automatic Project Scoping** - Each project gets its own repository scope
3. ✅ **Shared Repository Scope** (optional) - Cross-project learning when enabled
4. ✅ **Independent Development** - Each project can version separately
5. ✅ **Technology Diversity** - Each project chooses optimal stack

---

*Made with ❤️ by the Confucius AI Contributors*
