import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['../../vitest.setup.node.ts'],
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/server': path.resolve(__dirname, './__mocks__/next-server.ts'),
      '@pleeno/database/server': path.resolve(__dirname, './__mocks__/database-server.ts'),
    },
  },
})
