/**
 * IMovies Administrator Controller
 * Handles operational reporting, real-time analytics, entity management and showtime scheduling
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../db/database.js';
import { Showtime } from '../models/types.js';

export class AdminController {
  public static getDashboardStats = (_req: AuthenticatedRequest, res: Response): void => {
    try {
      db.cleanupExpiredSeatLocks();

      const movies = db.movies.find();
      const cinemas = db.cinemas.find();
      const screens = db.screens.find();
      const showtimes = db.showtimes.find();
      const bookings = db.bookings.find();
      const payments = db.payments.find();
      const allSeats = db.seatReservations.find();

      const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      const totalBookedSeats = allSeats.filter(s => s.status === 'booked').length;
      const totalSeats = allSeats.length;
      const occupancyRate = totalSeats > 0 ? Math.round((totalBookedSeats / totalSeats) * 1000) / 10 : 0;

      // Recent 10 bookings
      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map(b => {
          const movie = db.movies.findById(b.movieId);
          const cinema = db.cinemas.findById(b.cinemaId);
          return {
            ...b,
            movieTitle: movie?.title,
            cinemaName: cinema?.name
          };
        });

      res.status(200).json({
        success: true,
        stats: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalBookings: bookings.length,
          confirmedBookingsCount: confirmedBookings.length,
          occupancyRate,
          activeMoviesCount: movies.filter(m => m.status === 'now_showing').length,
          totalCinemasCount: cinemas.length,
          totalScreensCount: screens.length,
          totalShowtimesCount: showtimes.length,
          recentBookings
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getAllBookings = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { status, search } = req.query;
      let bookings = db.bookings.find();

      if (status && typeof status === 'string') {
        bookings = bookings.filter(b => b.status === status);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        bookings = bookings.filter(b => b.bookingReference.toLowerCase().includes(q));
      }

      const populated = bookings.map(b => {
        const movie = db.movies.findById(b.movieId);
        const cinema = db.cinemas.findById(b.cinemaId);
        const user = db.users.findById(b.userId);
        return {
          ...b,
          movieTitle: movie?.title,
          cinemaName: cinema?.name,
          customerName: user?.name || 'Guest User',
          customerEmail: user?.email
        };
      });

      populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json({ success: true, count: populated.length, bookings: populated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static createShowtime = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { movieId, cinemaId, screenId, startTime, format, priceTiers } = req.body;

      if (!movieId || !cinemaId || !screenId || !startTime || !priceTiers) {
        res.status(400).json({ success: false, error: 'All fields (movieId, cinemaId, screenId, startTime, priceTiers) are required' });
        return;
      }

      const screen = db.screens.findById(screenId);
      if (!screen) {
        res.status(404).json({ success: false, error: 'Screen not found' });
        return;
      }

      const startD = new Date(startTime);
      const endD = new Date(startD);
      endD.setHours(endD.getHours() + 2, endD.getMinutes() + 30);

      const showtimeId = `st_${Date.now()}`;
      const newShowtime: Showtime = {
        id: showtimeId,
        movieId,
        cinemaId,
        screenId,
        startTime: startD.toISOString(),
        endTime: endD.toISOString(),
        format: format || screen.screenType,
        priceTiers
      };

      db.showtimes.insertOne(newShowtime);

      // Generate seats
      const rowLetters = 'ABCDEFGHJK'.slice(0, screen.rows).split('');
      for (let r = 0; r < rowLetters.length; r++) {
        const row = rowLetters[r];
        let tier: any = 'standard';
        let price = priceTiers.standard;

        if (r >= screen.rows - 2) {
          tier = 'vip';
          price = priceTiers.vip;
        } else if (r >= 2) {
          tier = 'premium';
          price = priceTiers.premium;
        }

        for (let c = 1; c <= screen.cols; c++) {
          const seatNumber = `${row}${c}`;
          db.seatReservations.insertOne({
            id: `sr_${showtimeId}_${seatNumber}`,
            showtimeId,
            seatNumber,
            row,
            col: c,
            tier,
            price,
            status: 'available'
          });
        }
      }

      res.status(201).json({ success: true, showtime: newShowtime });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
