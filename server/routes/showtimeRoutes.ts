/**
 * IMovies Showtime & Seat Map Routes
 */

import { Router } from 'express';
import { ShowtimeController } from '../controllers/showtimeController.js';

export const showtimeRoutes = Router();

showtimeRoutes.get('/', ShowtimeController.getShowtimes);
showtimeRoutes.get('/:id', ShowtimeController.getShowtimeById);
showtimeRoutes.get('/:id/seats', ShowtimeController.getSeatMap);
