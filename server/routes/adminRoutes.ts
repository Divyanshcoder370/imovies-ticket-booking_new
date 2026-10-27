/**
 * IMovies Administrator Routes
 */

import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

export const adminRoutes = Router();

// Protect all admin routes with authentication and 'admin' role guard
adminRoutes.use(authenticate, requireRole(['admin']));

adminRoutes.get('/dashboard-stats', AdminController.getDashboardStats);
adminRoutes.get('/bookings', AdminController.getAllBookings);
adminRoutes.post('/showtimes', AdminController.createShowtime);
