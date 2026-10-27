/**
 * IMovies Server Entry Point
 * Mounts Express REST API v1 routes and Vite dev middleware
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './server/db/database.js';
import { authRoutes } from './server/routes/authRoutes.js';
import { movieRoutes } from './server/routes/movieRoutes.js';
import { cinemaRoutes } from './server/routes/cinemaRoutes.js';
import { showtimeRoutes } from './server/routes/showtimeRoutes.js';
import { bookingRoutes } from './server/routes/bookingRoutes.js';
import { paymentRoutes } from './server/routes/paymentRoutes.js';
import { adminRoutes } from './server/routes/adminRoutes.js';
import { errorHandler } from './server/middleware/errorHandlerMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT: number = Number(process.env.PORT) || 3000;

  // CORS middleware to allow cross-origin API calls and cloud domain routing
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Periodic background cleanup of expired 10-minute seat hold locks
  setInterval(() => {
    db.cleanupExpiredSeatLocks();
  }, 30000);

  // Health check endpoint
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'IMovies Movie Ticket Booking API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount REST API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/movies', movieRoutes);
  app.use('/api/v1/cinemas', cinemaRoutes);
  app.use('/api/v1/showtimes', showtimeRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Global Error Handler for API routes
  app.use('/api', errorHandler);

  // Frontend integration: Check if dist/index.html is built
  const distIndexPath = path.resolve(__dirname, 'dist', 'index.html');
  const distExists = fs.existsSync(distIndexPath);

  if (process.env.NODE_ENV === 'production' && distExists) {
    console.log('[IMovies] Production mode: Serving pre-built static client from dist/');
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    // Development mode or production deployment where build step was omitted (Render default)
    console.log(`[IMovies] ${process.env.NODE_ENV === 'production' ? 'Production without pre-built dist/' : 'Development mode'}: Mounting Vite middleware`);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IMovies] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[IMovies] Failed to start server:', err);
  process.exit(1);
});
