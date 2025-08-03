#!/usr/bin/env node

// Emergency deployment fix
// This script creates a minimal production server that serves the built files correctly

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import and setup API routes
import('./server/routes.js').then(({ registerRoutes }) => {
  registerRoutes(app);
}).catch(console.error);

// Production static file serving
const distPath = path.resolve(__dirname, 'dist', 'public');
console.log('Serving static files from:', distPath);
console.log('Directory exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  // Serve static assets with proper headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // SPA fallback - serve index.html for all routes
  app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.use('*', (req, res) => {
    res.status(500).send('Build files not found. Please run npm run build first.');
  });
}

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on port ${port}`);
});