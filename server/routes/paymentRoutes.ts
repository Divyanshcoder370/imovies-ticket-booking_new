/**
 * IMovies Payment Routes
 */

import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

export const paymentRoutes = Router();

paymentRoutes.post('/process', optionalAuth, PaymentController.processPayment);
paymentRoutes.get('/:id', optionalAuth, PaymentController.getPaymentStatus);
