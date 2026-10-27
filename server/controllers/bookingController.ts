/**
 * IMovies Booking Controller
 * Manages seat hold lockouts, checkout creation, cancellation and user bookings
 */

import { Response } from 'express';
import { BookingService } from '../services/bookingService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../db/database.js';

export class BookingController {
  public static holdSeats = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { showtimeId, seatNumbers } = req.body;
      const userId = req.user?.userId || `guest_${req.ip || 'anonymous'}`;

      if (!showtimeId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
        res.status(400).json({ success: false, error: 'showtimeId and an array of seatNumbers are required' });
        return;
      }

      const result = BookingService.holdSeats(showtimeId, seatNumbers, userId);
      res.status(200).json({
        success: true,
        message: `${seatNumbers.length} seat(s) held for 10 minutes`,
        ...result
      });
    } catch (err: any) {
      res.status(409).json({ success: false, error: err.message });
    }
  };

  public static releaseSeats = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { showtimeId, seatNumbers } = req.body;
      const userId = req.user?.userId || `guest_${req.ip || 'anonymous'}`;

      if (!showtimeId || !Array.isArray(seatNumbers)) {
        res.status(400).json({ success: false, error: 'showtimeId and seatNumbers array required' });
        return;
      }

      BookingService.releaseSeats(showtimeId, seatNumbers, userId);
      res.status(200).json({ success: true, message: 'Seats released' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public static createBooking = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { showtimeId, seatNumbers, concessions, discountCode } = req.body;
      const userId = req.user?.userId || req.body.guestUserId || `guest_${Date.now()}`;

      if (!showtimeId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
        res.status(400).json({ success: false, error: 'showtimeId and seatNumbers are required' });
        return;
      }

      const booking = BookingService.createBooking({
        userId,
        showtimeId,
        seatNumbers,
        concessions,
        discountCode
      });

      res.status(201).json({ success: true, booking });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public static getMyBookings = (req: AuthenticatedRequest, res: Response): void => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const bookings = db.bookings.find(b => b.userId === req.user!.userId);

      // Populate movie and cinema information
      const populated = bookings.map(b => {
        const movie = db.movies.findById(b.movieId);
        const cinema = db.cinemas.findById(b.cinemaId);
        const showtime = db.showtimes.findById(b.showtimeId);
        const screen = db.screens.findById(b.screenId);
        return {
          ...b,
          movie,
          cinema,
          showtime,
          screen
        };
      });

      // Sort recent first
      populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json({ success: true, count: populated.length, bookings: populated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getBookingByRef = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const booking = db.bookings.findOne(b => b.bookingReference === req.params.ref);
      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking reference not found' });
        return;
      }

      const movie = db.movies.findById(booking.movieId);
      const cinema = db.cinemas.findById(booking.cinemaId);
      const showtime = db.showtimes.findById(booking.showtimeId);
      const screen = db.screens.findById(booking.screenId);
      const payment = booking.paymentId ? db.payments.findById(booking.paymentId) : null;

      res.status(200).json({
        success: true,
        booking: {
          ...booking,
          movie,
          cinema,
          showtime,
          screen,
          payment
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static cancelBooking = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const result = BookingService.cancelBooking(id, userId, reason);
      res.status(200).json({
        success: true,
        message: `Booking cancelled successfully. Refund status: $${result.refundAmount} (${result.refundPercentage}%)`,
        ...result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
