import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'moholy',
      formats: ['es', 'umd'],
      fileName: (format) => `moholy.${format === 'es' ? 'esm' : 'umd'}.js`,
    },
    rollupOptions: {
      external: [],
    },
    minify: 'esbuild',
    sourcemap: true,
  },
})
