import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/index.js';
import { socketManager } from './sockets/socketManager.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './db/database.js';
import { seedDatabase } from './scripts/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
socketManager.init(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads & demo files
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'Paytm Commerce Intelligence API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRouter);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  // If database has no products, seed automatically
  if (db.getState().products.length === 0) {
    console.log('[Server] Database is empty. Auto-seeding baseline data...');
    await seedDatabase();
  }

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Paytm Commerce Intelligence API Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO: Initialized`);
    console.log(`🛍️  Merchant: Rajesh Kirana & General Store (M001)`);
    console.log(`=======================================================`);
  });
}

start().catch((err) => {
  console.error('[Server Startup Error]', err);
});

export { app, server };
