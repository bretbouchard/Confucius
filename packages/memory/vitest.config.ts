import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    transformMode: {
      web: [/\.(tsx?|jsx)$/],
      ssr: [/\.(tsx?|jsx)$/],
    },
    esbuild: {
      target: 'node18',
      format: 'esm',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/',
      ],
    },
  },
});
