import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON and urlencoded requests with increased limits for uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Basic request logger in dev
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (req.url.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.url}`);
      }
      next();
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Media Portal API',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Media Portal server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
