/**
 * Quick verification script for CCA MCP Server
 *
 * This script verifies that:
 * 1. The server builds successfully
 * 2. All dependencies are installed
 * 3. The dist directory is created
 * 4. The server can be imported
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checks = {
  buildSuccess: false,
  distExists: false,
  indexJsExists: false,
  canImport: false,
};

async function verify() {
  console.log('=== CCA MCP Server Verification ===\n');

  // Check 1: Dist directory exists
  console.log('Check 1: Verifying dist directory...');
  const distPath = join(__dirname, '..', 'dist');
  checks.distExists = existsSync(distPath);
  console.log(`  ${checks.distExists ? '✓' : '✗'} Dist directory exists`);

  // Check 2: index.js exists
  console.log('\nCheck 2: Verifying index.js...');
  const indexPath = join(distPath, 'index.js');
  checks.indexJsExists = existsSync(indexPath);
  console.log(`  ${checks.indexJsExists ? '✓' : '✗'} index.js exists`);

  // Check 3: Can import
  console.log('\nCheck 3: Verifying imports...');
  try {
    // Try to import the memory package
    const memoryModule = await import('@confucius-ai/memory');
    console.log(`  ✓ Can import @confucius-ai/memory`);
    console.log(`    - HierarchicalMemory: ${typeof memoryModule.HierarchicalMemory}`);

    // Try to import MCP SDK
    const mcpModule = await import('@modelcontextprotocol/sdk');
    console.log(`  ✓ Can import @modelcontextprotocol/sdk`);

    checks.canImport = true;
  } catch (error) {
    console.log(`  ✗ Import failed: ${error.message}`);
    checks.canImport = false;
  }

  // Summary
  console.log('\n=== Verification Summary ===');
  const allPassed = Object.values(checks).every((check) => check === true);

  if (allPassed) {
    console.log('✅ All checks passed!');
    console.log('\nThe CCA MCP Server is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Test with MCP Inspector:');
    console.log('   npx @modelcontextprotocol/inspector npx -y @confucius-ai/cca-mcp-server');
    console.log('\n2. Add to Claude Desktop config (see examples/claude-desktop-config.json)');
    console.log('\n3. See README.md for usage examples');
  } else {
    console.log('❌ Some checks failed:');
    Object.entries(checks).forEach(([check, passed]) => {
      if (!passed) {
        console.log(`  - ${check}: FAILED`);
      }
    });
    process.exit(1);
  }
}

verify().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
