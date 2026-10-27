/**
 * IMovies Movie Routes
 */

import { Router } from 'express';
import { MovieController } from '../controllers/movieController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { validateRequiredFields } from '../middleware/validationMiddleware.js';

export const movieRoutes = Router();

// Public routes
movieRoutes.get('/', MovieController.getAllMovies);
movieRoutes.get('/:id', MovieController.getMovieById);

// Admin-only routes
movieRoutes.post(
  '/',
  authenticate,
  requireRole(['admin']),
  validateRequiredFields(['title', 'description', 'durationMinutes', 'rating']),
  MovieController.createMovie
);

movieRoutes.put(
  '/:id',
  authenticate,
  requireRole(['admin']),
  MovieController.updateMovie
);

movieRoutes.delete(
  '/:id',
  authenticate,
  requireRole(['admin']),
  MovieController.deleteMovie
);
