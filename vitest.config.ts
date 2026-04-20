import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns - where to look for tests
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'web/src/utils/**/*.{test,spec}.{js,ts}',
    ],

    // Exclude patterns - don't test these
    exclude: [
      'node_modules',
      'web/node_modules',
      'dist',
      'web-dist',
      '.git',
    ],

    // Global test settings
    globals: true, // Use global test functions (describe, it, expect) without importing
    environment: 'node', // Run tests in Node.js environment (not browser)

    // Coverage settings (for test:coverage command)
    coverage: {
      provider: 'v8', // Built-in coverage provider
      reporter: ['text', 'html', 'json'], // Output formats
      exclude: [
        'node_modules',
        'dist',
        'web',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/types/**',
      ],
    },
  },
});
