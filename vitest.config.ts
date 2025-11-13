import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '**/*.config.{js,ts}',
        '**/*.test.{ts,tsx}',
        '**/dist/**',
        '**/.next/**',
        'packages/**/src/**/*.test.{ts,tsx}',
        'packages/**/src/__tests__/**',
        'packages/**/src/**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pleeno/utils': path.resolve(__dirname, './packages/utils/src'),
      '@pleeno/ui': path.resolve(__dirname, './packages/ui/src'),
      '@pleeno/stores': path.resolve(__dirname, './packages/stores/src'),
      // Mock Next.js modules for testing
      'next/server': path.resolve(__dirname, './test/mocks/next-server.ts'),
      '@sentry/nextjs': path.resolve(__dirname, './test/mocks/sentry.ts'),
    },
  },
})
