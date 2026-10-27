/**
 * IMovies Payment Controller
 */

import { Response } from 'express';
import { PaymentService } from '../services/paymentService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../db/database.js';

export class PaymentController {
  public static processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { bookingId, amount, method, cardDetails, upiDetails, simulateFailure } = req.body;
      const userId = req.user?.userId || req.body.userId || 'guest_checkout';

      if (!bookingId || !amount || !method) {
        res.status(400).json({ success: false, error: 'bookingId, amount, and method are required' });
        return;
      }

      const payment = await PaymentService.processPayment({
        bookingId,
        userId,
        amount: Number(amount),
        method,
        cardDetails,
        upiDetails,
        simulateFailure
      });

      const updatedBooking = db.bookings.findById(bookingId);

      res.status(200).json({
        success: true,
        message: 'Payment completed successfully. Booking confirmed.',
        payment,
        booking: updatedBooking
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Payment processing failed'
      });
    }
  };

  public static getPaymentStatus = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const payment = PaymentService.getPaymentById(req.params.id);
      if (!payment) {
        res.status(404).json({ success: false, error: 'Payment record not found' });
        return;
      }

      res.status(200).json({ success: true, payment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
