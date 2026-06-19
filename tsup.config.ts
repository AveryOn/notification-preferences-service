import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts', 'src/migrate.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: true,
  minify: false,
  dts: false,
  treeshake: true,
  tsconfig: 'tsconfig.json'
})
