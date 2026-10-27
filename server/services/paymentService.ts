/**
 * IMovies Payment Service
 * Handles multi-channel payment gateway simulation (Cards, UPI, NetBanking, Wallets),
 * transaction verification, and refunds.
 */

import crypto from 'crypto';
import { db } from '../db/database.js';
import { Payment, PaymentMethod } from '../models/types.js';
import { BookingService } from './bookingService.js';

export interface ProcessPaymentParams {
  bookingId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiry: string;
    cvv: string;
  };
  upiDetails?: {
    vpa: string;
  };
  simulateFailure?: boolean;
}

export class PaymentService {
  /**
   * Process a payment request for a pending booking
   */
  public static async processPayment(params: ProcessPaymentParams): Promise<Payment> {
    const booking = db.bookings.findById(params.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new Error(`Cannot pay for booking with status '${booking.status}'`);
    }

    if (Math.abs(booking.totalAmount - params.amount) > 0.05) {
      throw new Error(`Payment amount ($${params.amount}) does not match booking total ($${booking.totalAmount})`);
    }

    // Determine simulation behavior
    const isFailureRequested =
      params.simulateFailure === true ||
      (params.cardDetails?.cardNumber && params.cardDetails.cardNumber.endsWith('0002')) ||
      (params.upiDetails?.vpa && params.upiDetails.vpa.includes('fail'));

    const transactionRef = `TXN-${params.method.toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const paymentId = `pay_${crypto.randomUUID().slice(0, 8)}`;

    const last4 = params.cardDetails?.cardNumber
      ? params.cardDetails.cardNumber.slice(-4)
      : undefined;

    if (isFailureRequested) {
      const failedPayment: Payment = {
        id: paymentId,
        bookingId: params.bookingId,
        userId: params.userId,
        amount: params.amount,
        currency: 'USD',
        method: params.method,
        status: 'failed',
        transactionRef,
        cardLast4: last4,
        upiVpa: params.upiDetails?.vpa,
        gatewayResponse: {
          gateway: 'IMoviesPaymentMockGateway',
          message: 'Transaction declined by bank authorization network: Insufficient funds or card restriction.'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.payments.insertOne(failedPayment);
      throw new Error(failedPayment.gatewayResponse.message);
    }

    // Successful transaction
    const completedPayment: Payment = {
      id: paymentId,
      bookingId: params.bookingId,
      userId: params.userId,
      amount: params.amount,
      currency: 'USD',
      method: params.method,
      status: 'completed',
      transactionRef,
      cardLast4: last4,
      upiVpa: params.upiDetails?.vpa,
      gatewayResponse: {
        gateway: 'IMoviesPaymentMockGateway',
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        message: 'Payment verified and settled successfully.',
        rawTimestamp: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.payments.insertOne(completedPayment);

    // Transition booking to confirmed
    BookingService.confirmBooking(params.bookingId, paymentId, params.method);

    return completedPayment;
  }

  /**
   * Fetch payment details by ID
   */
  public static getPaymentById(paymentId: string): Payment | null {
    return db.payments.findById(paymentId);
  }
}
