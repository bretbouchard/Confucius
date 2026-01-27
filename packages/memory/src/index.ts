/**
 * CCA Memory - Hierarchical Memory System
 *
 * Multi-scope context management for complex multi-submodule coordination.
 */

// Core exports
export { HierarchicalMemory } from './core/HierarchicalMemory.js';
export type {
  MemoryConfig,
  Context,
  Artifact,
  ArtifactType,
  ScopeType,
} from './core/types.js';

// Scope exports
export { RepositoryScope } from './scopes/RepositoryScope.js';
export { SubmoduleScope } from './scopes/SubmoduleScope.js';
export { SessionScope } from './scopes/SessionScope.js';
export { TaskScope } from './scopes/TaskScope.js';
export type {
  Scope,
  ScopeConfig,
  RepositoryScopeConfig,
  SubmoduleScopeConfig,
  SessionScopeConfig,
  TaskScopeConfig,
} from './scopes/types.js';

// Compression exports
export { ContextCompressionEngine } from './compression/ContextCompressionEngine.js';
export type {
  CompressionConfig,
  CompressionResult,
  ArtifactExtractor,
  ContextSummarizer,
} from './compression/types.js';

// Storage exports
export { ArtifactStorage } from './storage/ArtifactStorage.js';
export { BeadsIntegration } from './storage/BeadsIntegration.js';
export type {
  StorageConfig,
  ArtifactMetadata,
  StorageBackend,
  BeadsConfig,
} from './storage/types.js';
