import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.glb'],  // Tell Vite to treat .glb files as assets
});
