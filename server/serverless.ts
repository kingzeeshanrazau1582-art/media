import express from 'express';
import apiRoutes from './routes/api';

const app = express();

// Increase JSON & urlencoded limits for handling large image/media payloads
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: true, limit: '250mb' }));

// CORS headers for serverless environment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoints
const healthCheck = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'Media Portal Serverless API',
    environment: process.env.VERCEL ? 'vercel' : 'standard',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// Mount routes on both '/api' and root '/' to ensure compatibility with Vercel route rewrites
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Serverless Error]', err);
  res.status(err?.status || 500).json({
    error: err?.message || 'Internal Server Error',
    status: err?.status || 500
  });
});

export default app;
