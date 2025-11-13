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
    server: {
      deps: {
        inline: ['@supabase/supabase-js', 'resend'],
      },
    },
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
      '@': path.resolve(__dirname, './apps/agency'),
      '@pleeno/utils': path.resolve(__dirname, './packages/utils/src'),
      '@pleeno/ui': path.resolve(__dirname, './packages/ui/src'),
      '@pleeno/stores': path.resolve(__dirname, './packages/stores/src'),
      '@pleeno/database': path.resolve(__dirname, './packages/database/src'),
      '@pleeno/validations': path.resolve(__dirname, './packages/validations/src'),
      '@pleeno/auth': path.resolve(__dirname, './packages/auth/src'),
      // App-specific aliases for testing
      '@agency': path.resolve(__dirname, './apps/agency'),
      '@payments': path.resolve(__dirname, './apps/payments'),
      '@dashboard': path.resolve(__dirname, './apps/dashboard'),
      '@entities': path.resolve(__dirname, './apps/entities'),
      '@shell': path.resolve(__dirname, './apps/shell'),
      '@reports': path.resolve(__dirname, './apps/reports'),
      // Mock Next.js modules for testing
      'next/server': path.resolve(__dirname, './test/mocks/next-server.ts'),
      '@sentry/nextjs': path.resolve(__dirname, './test/mocks/sentry.ts'),
    },
  },
})
