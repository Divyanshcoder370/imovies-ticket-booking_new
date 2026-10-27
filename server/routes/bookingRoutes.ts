/**
 * IMovies Booking Routes
 */

import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

export const bookingRoutes = Router();

// Seat hold lockouts (allow guest or authenticated user)
bookingRoutes.post('/hold', optionalAuth, BookingController.holdSeats);
bookingRoutes.post('/release', optionalAuth, BookingController.releaseSeats);

// Create checkout booking
bookingRoutes.post('/checkout', optionalAuth, BookingController.createBooking);

// User bookings list (authenticated)
bookingRoutes.get('/my', authenticate, BookingController.getMyBookings);

// Booking ticket pass by reference code
bookingRoutes.get('/reference/:ref', optionalAuth, BookingController.getBookingByRef);

// Cancellation
bookingRoutes.post('/:id/cancel', authenticate, BookingController.cancelBooking);
