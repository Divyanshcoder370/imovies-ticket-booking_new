/**
 * IMovies Data Models and Types
 * Represents the complete domain entities for User, Movie, Cinema, Screen,
 * Showtime, Seat Reservation, Booking, and Payment.
 */

export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export type MovieStatus = 'now_showing' | 'coming_soon';

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  durationMinutes: number;
  rating: string; // e.g. PG-13, R
  score: number; // e.g. 8.8
  releaseDate: string;
  language: string;
  director: string;
  cast: string[];
  trailerUrl: string;
  status: MovieStatus;
  formatAvailable: ('IMAX 3D' | 'Dolby Atmos' | '4K Laser' | 'Standard 2D')[];
  createdAt: string;
}

export interface Cinema {
  id: string;
  name: string;
  city: string;
  location: string;
  address: string;
  phone: string;
  amenities: string[];
  imageUrl: string;
}

export type ScreenType = 'IMAX 3D' | 'Dolby Atmos' | '4K Laser' | 'VIP Lounge';

export interface Screen {
  id: string;
  cinemaId: string;
  name: string;
  screenType: ScreenType;
  rows: number;
  cols: number;
  totalSeats: number;
}

export interface PriceTiers {
  standard: number;
  premium: number;
  vip: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  screenId: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  format: ScreenType;
  priceTiers: PriceTiers;
}

export type SeatTier = 'standard' | 'premium' | 'vip';
export type SeatStatus = 'available' | 'locked' | 'booked';

export interface SeatReservation {
  id: string;
  showtimeId: string;
  seatNumber: string; // e.g. "C4"
  row: string;        // e.g. "C"
  col: number;        // e.g. 4
  tier: SeatTier;
  price: number;
  status: SeatStatus;
  userId?: string;
  bookingId?: string;
  lockedAt?: string;
  expiresAt?: string;
}

export interface ConcessionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Popcorn' | 'Snacks' | 'Beverages' | 'Combos';
  imageUrl?: string;
}

export interface SelectedConcession {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';

export interface Booking {
  id: string;
  bookingReference: string; // e.g. "IMV-98421"
  userId: string;
  showtimeId: string;
  movieId: string;
  cinemaId: string;
  screenId: string;
  seats: string[];
  seatDetails: {
    seatNumber: string;
    tier: SeatTier;
    price: number;
  }[];
  concessions: SelectedConcession[];
  subtotal: number;
  convenienceFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: BookingStatus;
  paymentId: string | null;
  paymentMethod?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
}

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
export type PaymentStatus = 'initiated' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  cardLast4?: string;
  upiVpa?: string;
  gatewayResponse: {
    gateway: string;
    authCode?: string;
    message?: string;
    rawTimestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}
