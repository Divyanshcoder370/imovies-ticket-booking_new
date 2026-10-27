/**
 * IMovies Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequiredFields } from '../middleware/validationMiddleware.js';

export const authRoutes = Router();

authRoutes.post('/register', validateRequiredFields(['name', 'email', 'password']), AuthController.register);
authRoutes.post('/login', validateRequiredFields(['email', 'password']), AuthController.login);
authRoutes.get('/me', authenticate, AuthController.getMe);
