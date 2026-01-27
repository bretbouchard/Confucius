/**
 * CCA MCP Server Usage Examples
 *
 * This file demonstrates how to use the CCA MCP Server tools.
 */

// Example 1: Storing a pattern after fixing a bug
async function example1_storePattern() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'task',
      artifactType: 'pattern',
      content: 'When fixing SwiftUI preview crashes, always check for missing @State bindings and ensure View conforms to Identifiable. Also verify that @State variables are marked private and initialized with default values.',
      metadata: {
        tags: ['swiftui', 'preview', 'debugging', 'ios'],
        confidence: 0.95,
        taskId: 'white_room-123',
        file: 'swift_frontend/Views/DrumPadView.swift',
        language: 'swift'
      }
    }
  };

  console.log('Example 1: Storing a pattern');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 2: Retrieving context before starting work
async function example2_retrieveContext() {
  const toolCall = {
    name: 'memory_retrieve',
    arguments: {
      query: 'JUCE build errors CMake compilation linker',
      activeScope: 'repository'
    }
  };

  console.log('\nExample 2: Retrieving context');
  console.log(JSON.stringify(toolCall, null, 2));

  // Expected response includes:
  // - Relevant artifacts about build issues
  // - Compression ratio
  // - Token counts per scope
}

// Example 3: Creating a task scope
async function example3_createTaskScope() {
  const toolCall = {
    name: 'memory_create_task',
    arguments: {
      taskId: 'white_room-319',
      taskContext: {
        title: 'Create CCA MCP Server',
        description: 'Implement MCP server for Confucius hierarchical memory system',
        labels: ['feature', 'mcp', 'memory'],
        priority: 'high',
        assignee: 'claude',
        estimatedTime: '2-3 hours'
      }
    }
  };

  console.log('\nExample 3: Creating task scope');
  console.log(JSON.stringify(toolCall, null, 2));

  // This will:
  // 1. Create a new task scope
  // 2. Auto-inject relevant context from repository and submodule scopes
  // 3. Populate with patterns related to MCP, memory systems, etc.
}

// Example 4: Storing an error message
async function example4_storeError() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'submodule',
      artifactType: 'error_message',
      content: 'TypeError: Cannot read property "forEach" of undefined at AudioProcessor.processAudio (audio_processor.ts:145). Fix: Always validate audioBuffers exists before calling forEach. Add guard: if (!audioBuffers || audioBuffers.length === 0) return;',
      metadata: {
        tags: ['typescript', 'audio', 'runtime-error'],
        confidence: 0.9,
        submodule: 'sdk',
        file: 'sdk/audio/AudioProcessor.ts',
        language: 'typescript',
        related: ['white_room-100', 'white_room-105']
      }
    }
  };

  console.log('\nExample 4: Storing error message');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 5: Storing a design decision
async function example5_storeDesignDecision() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'repository',
      artifactType: 'design_decision',
      content: 'Decision: Use MCP (Model Context Protocol) for Confucius integration. Rationale: 1) Standard protocol ensures compatibility 2) Official SDK support 3) Easy integration with Claude Desktop 4) Future-proof for other AI clients. Alternatives considered: Custom REST API (rejected - non-standard), gRPC (rejected - overkill).',
      metadata: {
        tags: ['architecture', 'mcp', 'integration', 'decision'],
        confidence: 1.0,
        related: ['white_room-300', 'white_room-301'],
        date: '2025-01-16'
      }
    }
  };

  console.log('\nExample 5: Storing design decision');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 6: Getting statistics
async function example6_getStats() {
  const toolCall = {
    name: 'memory_stats',
    arguments: {}
  };

  console.log('\nExample 6: Getting statistics');
  console.log(JSON.stringify(toolCall, null, 2));

  // Expected response:
  // {
  //   "success": true,
  //   "stats": {
  //     "scopes": 4,
  //     "artifacts": 127,
  //     "totalTokens": 4532,
  //     "config": {
  //       "repository": "/path/to/white_room",
  //       "submodules": ["sdk", "juce_backend", ...]
  //     }
  //   }
  // }
}

// Example 7: Searching within a specific scope
async function example7_searchScope() {
  const toolCall = {
    name: 'memory_search_scopes',
    arguments: {
      query: 'TypeScript module resolution ES imports',
      scope: 'repository'
    }
  };

  console.log('\nExample 7: Searching within scope');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 8: Storing a build log
async function example8_storeBuildLog() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'submodule',
      artifactType: 'build_log',
      content: 'CMake Error: Could not find JUCE framework. Solution: Set JUCE_DIR environment variable to /Applications/JUCE. Add to ~/.zshrc: export JUCE_DIR=/Applications/JUCE. Then run: cmake -B build -DCMAKE_FRAMEWORK_PATH=$JUCE_DIR',
      metadata: {
        tags: ['cmake', 'juce', 'build', 'macos'],
        confidence: 0.85,
        submodule: 'juce_backend',
        language: 'cmake'
      }
    }
  };

  console.log('\nExample 8: Storing build log');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 9: Storing test results
async function example9_storeTestResult() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'session',
      artifactType: 'test_result',
      content: 'Unit test failure: AudioProcessorTests.processAudio_shouldHandleBuffers. Issue: Test assumed 48kHz sample rate but system was 44.1kHz. Fix: Make tests sample-rate agnostic by using config.sampleRate instead of hardcoded value.',
      metadata: {
        tags: ['testing', 'audio', 'vitest'],
        confidence: 0.9,
        file: 'sdk/audio/__tests__/AudioProcessor.test.ts',
        language: 'typescript'
      }
    }
  };

  console.log('\nExample 9: Storing test result');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Example 10: Storing a conversation summary
async function example10_storeConversation() {
  const toolCall = {
    name: 'memory_store',
    arguments: {
      scope: 'session',
      artifactType: 'conversation',
      content: 'Discussion about migrating from Redux to Zustand for state management. Key points: 1) Zustand has simpler API (no providers/actions) 2) Smaller bundle size 3) Better TypeScript support 4) Easier to test. Decision: Migrate to Zustand incrementally, starting with audio module.',
      metadata: {
        tags: ['architecture', 'state-management', 'redux', 'zustand'],
        confidence: 0.8,
        participants: ['bret', 'claude']
      }
    }
  };

  console.log('\nExample 10: Storing conversation summary');
  console.log(JSON.stringify(toolCall, null, 2));
}

// Run all examples
async function main() {
  console.log('=== CCA MCP Server Usage Examples ===\n');

  await example1_storePattern();
  await example2_retrieveContext();
  await example3_createTaskScope();
  await example4_storeError();
  await example5_storeDesignDecision();
  await example6_getStats();
  await example7_searchScope();
  await example8_storeBuildLog();
  await example9_storeTestResult();
  await example10_storeConversation();

  console.log('\n=== End of Examples ===');
  console.log('\nTo use these tools:');
  console.log('1. Start the CCA MCP Server');
  console.log('2. Configure in Claude Desktop or MCP Inspector');
  console.log('3. Call tools using the MCP protocol');
  console.log('4. See README.md for detailed documentation');
}

main().catch(console.error);
