import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = join(__dirname, "dist");

// Check if dist directory exists
if (!existsSync(distPath)) {
  console.error("Dist directory not found. Please run 'npm run build' first.");
  process.exit(1);
}

// Disable Express's default MIME type detection
app.use(express.static(distPath, {
  // Set explicit MIME types to avoid issues
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.woff')) {
      res.setHeader('Content-Type', 'font/woff');
    } else if (filePath.endsWith('.woff2')) {
      res.setHeader('Content-Type', 'font/woff2');
    } else if (filePath.endsWith('.ttf')) {
      res.setHeader('Content-Type', 'font/ttf');
    }
  },
  maxAge: '1y',
  etag: true,
  lastModified: true,
}));

// Handle SPA routing - serve index.html for all non-file, non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes or static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${distPath}`);
});
