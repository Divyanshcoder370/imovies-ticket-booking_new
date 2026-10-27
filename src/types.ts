export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  tagline: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  durationMinutes: number;
  rating: string;
  score: number;
  releaseDate: string;
  language: string;
  director: string;
  cast: string[];
  trailerUrl: string;
  status: 'now_showing' | 'coming_soon';
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

export interface Screen {
  id: string;
  cinemaId: string;
  name: string;
  screenType: 'IMAX 3D' | 'Dolby Atmos' | '4K Laser' | 'VIP Lounge';
  rows: number;
  cols: number;
  totalSeats: number;
}

export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  format: 'IMAX 3D' | 'Dolby Atmos' | '4K Laser' | 'VIP Lounge';
  priceTiers: {
    standard: number;
    premium: number;
    vip: number;
  };
  movieTitle?: string;
  cinemaName?: string;
  cinemaCity?: string;
  screenName?: string;
}

export interface SeatReservation {
  id: string;
  showtimeId: string;
  seatNumber: string;
  row: string;
  col: number;
  tier: 'standard' | 'premium' | 'vip';
  price: number;
  status: 'available' | 'locked' | 'booked';
  userId?: string;
  lockedAt?: string;
  expiresAt?: string;
}

export interface ConcessionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Popcorn' | 'Snacks' | 'Beverages' | 'Combos';
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  movieId: string;
  cinemaId: string;
  screenId: string;
  seats: string[];
  seatDetails: {
    seatNumber: string;
    tier: 'standard' | 'premium' | 'vip';
    price: number;
  }[];
  concessions: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  convenienceFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentId: string | null;
  paymentMethod?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  movie?: Movie;
  cinema?: Cinema;
  showtime?: Showtime;
  screen?: Screen;
}
