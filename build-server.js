#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildServer() {
  try {
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      outdir: 'dist',
      format: 'esm',
      platform: 'node',
      packages: 'external',
      define: {
        // Provide polyfills for CommonJS globals in ESM
        '__dirname': 'import.meta.dirname',
        '__filename': 'import.meta.filename',
      },
      banner: {
        js: `
// ESM compatibility polyfills
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim()
      }
    });
    
    console.log('✅ Server built successfully with ESM compatibility');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildServer();