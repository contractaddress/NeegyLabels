// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  security: {
    checkOrigin: false,
  },
  vite: {
    ssr: {
      external: ['better-sqlite3'],
    },
  },
});
