/**
 * IMovies Booking Service
 * Orchestrates seat reservation locks (10-min window), atomic conflict validation,
 * booking creation, fee calculations, and cancellations.
 */

import crypto from 'crypto';
import { db } from '../db/database.js';
import {
  Booking,
  SeatReservation,
  SelectedConcession,
  BookingStatus
} from '../models/types.js';

export const SEAT_LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const CONVENIENCE_FEE_PER_TICKET = 1.75;
const TAX_RATE = 0.08875; // 8.875% tax

export class BookingService {
  /**
   * Lock seats for a user during checkout with a 10-minute countdown
   */
  public static holdSeats(
    showtimeId: string,
    seatNumbers: string[],
    userId: string
  ): { lockedSeats: SeatReservation[]; expiresAt: string } {
    db.cleanupExpiredSeatLocks();

    const showtime = db.showtimes.findById(showtimeId);
    if (!showtime) {
      throw new Error('Showtime not found');
    }

    const expiresAt = new Date(Date.now() + SEAT_LOCK_DURATION_MS).toISOString();
    const lockedSeats: SeatReservation[] = [];

    // Verify all seats are currently available
    for (const seatNumber of seatNumbers) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === showtimeId && s.seatNumber === seatNumber
      );

      if (!seat) {
        throw new Error(`Seat ${seatNumber} does not exist in this auditorium`);
      }

      if (seat.status === 'booked') {
        throw new Error(`Seat ${seatNumber} is already booked`);
      }

      // If locked by another user and not expired
      if (seat.status === 'locked' && seat.userId !== userId) {
        throw new Error(`Seat ${seatNumber} is currently on hold by another customer`);
      }
    }

    // Now atomically lock the seats
    for (const seatNumber of seatNumbers) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === showtimeId && s.seatNumber === seatNumber
      )!;

      const updated = db.seatReservations.updateOne(seat.id, {
        status: 'locked',
        userId,
        lockedAt: new Date().toISOString(),
        expiresAt
      });

      if (updated) {
        lockedSeats.push(updated);
      }
    }

    return { lockedSeats, expiresAt };
  }

  /**
   * Release locked seats when user abandons or leaves checkout
   */
  public static releaseSeats(showtimeId: string, seatNumbers: string[], userId: string): void {
    for (const seatNumber of seatNumbers) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === showtimeId && s.seatNumber === seatNumber && s.userId === userId && s.status === 'locked'
      );
      if (seat) {
        db.seatReservations.updateOne(seat.id, {
          status: 'available',
          userId: undefined,
          lockedAt: undefined,
          expiresAt: undefined
        });
      }
    }
  }

  /**
   * Create a pending or confirmed booking
   */
  public static createBooking(params: {
    userId: string;
    showtimeId: string;
    seatNumbers: string[];
    concessions?: { id: string; quantity: number }[];
    discountCode?: string;
  }): Booking {
    db.cleanupExpiredSeatLocks();

    const showtime = db.showtimes.findById(params.showtimeId);
    if (!showtime) {
      throw new Error('Showtime not found');
    }

    // Find and validate reserved seats
    const seatDetails: { seatNumber: string; tier: any; price: number }[] = [];
    let ticketSubtotal = 0;

    for (const seatNumber of params.seatNumbers) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === params.showtimeId && s.seatNumber === seatNumber
      );

      if (!seat) {
        throw new Error(`Seat ${seatNumber} not found`);
      }

      if (seat.status === 'booked') {
        throw new Error(`Seat ${seatNumber} has already been purchased`);
      }

      // Ensure caller is the one holding it
      if (seat.status === 'locked' && seat.userId && seat.userId !== params.userId) {
        throw new Error(`Seat ${seatNumber} hold has expired or belongs to another user`);
      }

      seatDetails.push({
        seatNumber: seat.seatNumber,
        tier: seat.tier,
        price: seat.price
      });

      ticketSubtotal += seat.price;
    }

    // Process Concessions
    let concessionsSubtotal = 0;
    const selectedConcessions: SelectedConcession[] = [];

    if (params.concessions && params.concessions.length > 0) {
      for (const item of params.concessions) {
        if (item.quantity <= 0) continue;
        const concession = db.concessions.findById(item.id);
        if (concession) {
          selectedConcessions.push({
            id: concession.id,
            name: concession.name,
            quantity: item.quantity,
            price: concession.price
          });
          concessionsSubtotal += concession.price * item.quantity;
        }
      }
    }

    const subtotal = ticketSubtotal + concessionsSubtotal;
    const convenienceFee = params.seatNumbers.length * CONVENIENCE_FEE_PER_TICKET;
    let discountAmount = 0;

    if (params.discountCode?.toUpperCase() === 'IMOVIES10') {
      discountAmount = Math.round(subtotal * 0.1 * 100) / 100;
    } else if (params.discountCode?.toUpperCase() === 'VIP5') {
      discountAmount = 5.0;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount + convenienceFee);
    const taxAmount = Math.round(taxableAmount * TAX_RATE * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const bookingRef = `IMV-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingId = `bok_${crypto.randomUUID().slice(0, 8)}`;

    const booking: Booking = {
      id: bookingId,
      bookingReference: bookingRef,
      userId: params.userId,
      showtimeId: params.showtimeId,
      movieId: showtime.movieId,
      cinemaId: showtime.cinemaId,
      screenId: showtime.screenId,
      seats: params.seatNumbers,
      seatDetails,
      concessions: selectedConcessions,
      subtotal,
      convenienceFee,
      taxAmount,
      discountAmount,
      totalAmount,
      status: 'pending',
      paymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.bookings.insertOne(booking);

    return booking;
  }

  /**
   * Confirm booking once payment has successfully processed
   */
  public static confirmBooking(bookingId: string, paymentId: string, paymentMethod: string): Booking {
    const booking = db.bookings.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Permanently mark seats as booked
    for (const seatNumber of booking.seats) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === booking.showtimeId && s.seatNumber === seatNumber
      );
      if (seat) {
        db.seatReservations.updateOne(seat.id, {
          status: 'booked',
          userId: booking.userId,
          bookingId: booking.id,
          expiresAt: undefined
        });
      }
    }

    const updated = db.bookings.updateOne(bookingId, {
      status: 'confirmed',
      paymentId,
      paymentMethod
    })!;

    return updated;
  }

  /**
   * Cancel booking with refund eligibility calculation:
   * - > 2 hours prior to showtime: 100% refund
   * - 1 - 2 hours prior to showtime: 50% refund (convenience fee deducted)
   * - < 1 hour or past showtime: Ineligible for refund
   */
  public static cancelBooking(bookingId: string, userId: string, reason?: string): {
    booking: Booking;
    refundAmount: number;
    refundPercentage: number;
  } {
    const booking = db.bookings.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const user = db.users.findById(userId);
    if (booking.userId !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      throw new Error('Booking is already cancelled');
    }

    const showtime = db.showtimes.findById(booking.showtimeId);
    if (!showtime) {
      throw new Error('Associated showtime not found');
    }

    const showtimeStart = new Date(showtime.startTime).getTime();
    const now = Date.now();
    const hoursRemaining = (showtimeStart - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursRemaining >= 2) {
      refundPercentage = 100;
    } else if (hoursRemaining >= 1) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.round(((booking.totalAmount * refundPercentage) / 100) * 100) / 100;

    // Release booked seats back to available
    for (const seatNumber of booking.seats) {
      const seat = db.seatReservations.findOne(
        s => s.showtimeId === booking.showtimeId && s.seatNumber === seatNumber
      );
      if (seat) {
        db.seatReservations.updateOne(seat.id, {
          status: 'available',
          userId: undefined,
          bookingId: undefined,
          lockedAt: undefined,
          expiresAt: undefined
        });
      }
    }

    // Update booking status
    const newStatus: BookingStatus = refundAmount > 0 ? 'refunded' : 'cancelled';
    const updated = db.bookings.updateOne(bookingId, {
      status: newStatus,
      cancellationReason: reason || 'Customer requested cancellation',
      refundAmount,
      cancelledAt: new Date().toISOString()
    })!;

    // Update payment record if exists
    if (booking.paymentId) {
      db.payments.updateOne(booking.paymentId, {
        status: refundAmount > 0 ? 'refunded' : 'completed'
      });
    }

    return {
      booking: updated,
      refundAmount,
      refundPercentage
    };
  }
}
