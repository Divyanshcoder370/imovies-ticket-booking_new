/**
 * IMovies Cinema & Concessions Routes
 */

import { Router } from 'express';
import { CinemaController } from '../controllers/cinemaController.js';

export const cinemaRoutes = Router();

cinemaRoutes.get('/', CinemaController.getAllCinemas);
cinemaRoutes.get('/concessions', CinemaController.getConcessions);
cinemaRoutes.get('/:id', CinemaController.getCinemaById);
cinemaRoutes.get('/:cinemaId/screens', CinemaController.getScreens);
