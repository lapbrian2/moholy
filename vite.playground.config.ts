import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'playground',
  resolve: {
    alias: {
      moholy: resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist-playground'),
    emptyOutDir: true,
  },
})
