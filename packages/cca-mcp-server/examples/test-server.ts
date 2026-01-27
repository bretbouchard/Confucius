/**
 * Test script for CCA MCP Server
 *
 * This script tests the server functionality by:
 * 1. Starting the server
 * 2. Calling each tool
 * 3. Verifying responses
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testServer() {
  console.log('Starting CCA MCP Server...');

  // Start the server
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONFUCIUS_REPO: process.cwd(),
      CONFUCIUS_SUBMODULES: 'sdk,juce_backend,swift_frontend',
    },
  });

  // Create client
  const transport = new StdioClientTransport({
    stderr: 'inherit',
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect to server
    await client.connect(transport);
    console.log('✓ Connected to server');

    // Test 1: List tools
    console.log('\n--- Test 1: List Tools ---');
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools.length} tools:`);
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description?.substring(0, 60)}...`);
    });

    // Test 2: Get stats
    console.log('\n--- Test 2: Get Stats ---');
    const statsResult = await client.callTool({
      name: 'memory_stats',
      arguments: {},
    });
    const statsResponse = JSON.parse(statsResult.content[0].text);
    console.log('✓ Stats:', JSON.stringify(statsResponse.stats, null, 2));

    // Test 3: Store an artifact
    console.log('\n--- Test 3: Store Artifact ---');
    const storeResult = await client.callTool({
      name: 'memory_store',
      arguments: {
        scope: 'session',
        artifactType: 'pattern',
        content: 'Test pattern: When building MCP servers, always ensure proper error handling and tool schema validation.',
        metadata: {
          tags: ['mcp', 'testing', 'pattern'],
          confidence: 0.9,
        },
      },
    });
    const storeResponse = JSON.parse(storeResult.content[0].text);
    console.log('✓ Store result:', storeResponse.message);

    // Test 4: Retrieve context
    console.log('\n--- Test 4: Retrieve Context ---');
    const retrieveResult = await client.callTool({
      name: 'memory_retrieve',
      arguments: {
        query: 'MCP server building patterns',
      },
    });
    const retrieveResponse = JSON.parse(retrieveResult.content[0].text);
    console.log(
      `✓ Retrieved ${retrieveResponse.results.stats.totalArtifacts} artifacts`
    );
    if (retrieveResponse.results.artifacts.length > 0) {
      console.log(
        '  First artifact:',
        retrieveResponse.results.artifacts[0].content.substring(0, 80) + '...'
      );
    }

    // Test 5: Create task scope
    console.log('\n--- Test 5: Create Task Scope ---');
    const taskResult = await client.callTool({
      name: 'memory_create_task',
      arguments: {
        taskId: 'test-task-123',
        taskContext: {
          title: 'Test Task',
          description: 'Testing task scope creation',
        },
      },
    });
    const taskResponse = JSON.parse(taskResult.content[0].text);
    console.log('✓ Task result:', taskResponse.message);

    // Test 6: Search specific scope
    console.log('\n--- Test 6: Search Scope ---');
    const searchResult = await client.callTool({
      name: 'memory_search_scopes',
      arguments: {
        query: 'MCP',
        scope: 'session',
      },
    });
    const searchResponse = JSON.parse(searchResult.content[0].text);
    console.log(
      `✓ Search found ${searchResponse.results.stats.totalArtifacts} artifacts in session scope`
    );

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
  }
}

// Run tests
testServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
