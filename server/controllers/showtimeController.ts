/**
 * IMovies Showtime & Seat Map Controller
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';

export class ShowtimeController {
  public static getShowtimes = (req: Request, res: Response): void => {
    try {
      db.cleanupExpiredSeatLocks();
      const { movieId, cinemaId, date } = req.query;

      let showtimes = db.showtimes.find();

      if (movieId && typeof movieId === 'string') {
        showtimes = showtimes.filter(s => s.movieId === movieId);
      }

      if (cinemaId && typeof cinemaId === 'string') {
        showtimes = showtimes.filter(s => s.cinemaId === cinemaId);
      }

      if (date && typeof date === 'string') {
        showtimes = showtimes.filter(s => s.startTime.startsWith(date));
      }

      // Populate movie and cinema metadata for convenient display
      const populated = showtimes.map(st => {
        const movie = db.movies.findById(st.movieId);
        const cinema = db.cinemas.findById(st.cinemaId);
        const screen = db.screens.findById(st.screenId);
        return {
          ...st,
          movieTitle: movie?.title,
          cinemaName: cinema?.name,
          cinemaCity: cinema?.city,
          screenName: screen?.name
        };
      });

      res.status(200).json({ success: true, count: populated.length, showtimes: populated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getShowtimeById = (req: Request, res: Response): void => {
    try {
      db.cleanupExpiredSeatLocks();
      const showtime = db.showtimes.findById(req.params.id);
      if (!showtime) {
        res.status(404).json({ success: false, error: 'Showtime not found' });
        return;
      }

      const movie = db.movies.findById(showtime.movieId);
      const cinema = db.cinemas.findById(showtime.cinemaId);
      const screen = db.screens.findById(showtime.screenId);

      res.status(200).json({
        success: true,
        showtime: {
          ...showtime,
          movie,
          cinema,
          screen
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getSeatMap = (req: Request, res: Response): void => {
    try {
      db.cleanupExpiredSeatLocks();
      const showtime = db.showtimes.findById(req.params.id);
      if (!showtime) {
        res.status(404).json({ success: false, error: 'Showtime not found' });
        return;
      }

      const screen = db.screens.findById(showtime.screenId);
      const seats = db.seatReservations.find(s => s.showtimeId === showtime.id);

      res.status(200).json({
        success: true,
        showtimeId: showtime.id,
        screen,
        totalSeats: screen?.totalSeats || seats.length,
        availableCount: seats.filter(s => s.status === 'available').length,
        lockedCount: seats.filter(s => s.status === 'locked').length,
        bookedCount: seats.filter(s => s.status === 'booked').length,
        seats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
