import { Movie, Cinema, Showtime, SeatReservation, ConcessionItem, Booking, User } from '../types';

const BASE_URL = '/api/v1';

export class ApiClient {
  private static token: string | null = typeof window !== 'undefined' ? localStorage.getItem('imovies_token') : null;

  public static setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('imovies_token', token);
      } else {
        localStorage.removeItem('imovies_token');
      }
    }
  }

  public static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return this.token || localStorage.getItem('imovies_token');
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  public static async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public static async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  public static logout() {
    this.setToken(null);
  }

  // Movies
  public static async getMovies(params?: { status?: string; genre?: string; search?: string }): Promise<{ movies: Movie[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.genre) query.append('genre', params.genre);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ movies: Movie[] }>(`/movies${qs}`);
  }

  public static async getMovieById(id: string): Promise<{ movie: Movie }> {
    return this.request<{ movie: Movie }>(`/movies/${id}`);
  }

  // Cinemas
  public static async getCinemas(city?: string): Promise<{ cinemas: Cinema[] }> {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    return this.request<{ cinemas: Cinema[] }>(`/cinemas${qs}`);
  }

  public static async getCinemaScreens(cinemaId: string): Promise<{ screens: any[] }> {
    return this.request<{ screens: any[] }>(`/cinemas/${cinemaId}/screens`);
  }

  public static async getConcessions(): Promise<{ concessions: ConcessionItem[] }> {
    return this.request<{ concessions: ConcessionItem[] }>('/cinemas/concessions');
  }

  // Showtimes & Seats
  public static async getShowtimes(params?: { movieId?: string; cinemaId?: string; date?: string }): Promise<{ showtimes: Showtime[] }> {
    const query = new URLSearchParams();
    if (params?.movieId) query.append('movieId', params.movieId);
    if (params?.cinemaId) query.append('cinemaId', params.cinemaId);
    if (params?.date) query.append('date', params.date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ showtimes: Showtime[] }>(`/showtimes${qs}`);
  }

  public static async getSeatMap(showtimeId: string): Promise<{
    screen: any;
    seats: SeatReservation[];
    availableCount: number;
    lockedCount: number;
    bookedCount: number;
  }> {
    return this.request(`/showtimes/${showtimeId}/seats`);
  }

  // Bookings
  public static async holdSeats(showtimeId: string, seatNumbers: string[]): Promise<{ lockedSeats: SeatReservation[]; expiresAt: string }> {
    return this.request('/bookings/hold', {
      method: 'POST',
      body: JSON.stringify({ showtimeId, seatNumbers })
    });
  }

  public static async releaseSeats(showtimeId: string, seatNumbers: string[]): Promise<void> {
    return this.request('/bookings/release', {
      method: 'POST',
      body: JSON.stringify({ showtimeId, seatNumbers })
    });
  }

  public static async checkout(data: {
    showtimeId: string;
    seatNumbers: string[];
    concessions?: { id: string; quantity: number }[];
    discountCode?: string;
  }): Promise<{ booking: Booking }> {
    return this.request('/bookings/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public static async getMyBookings(): Promise<{ bookings: Booking[] }> {
    return this.request('/bookings/my');
  }

  public static async getBookingByRef(ref: string): Promise<{ booking: Booking }> {
    return this.request(`/bookings/reference/${ref}`);
  }

  public static async cancelBooking(bookingId: string, reason?: string): Promise<{
    booking: Booking;
    refundAmount: number;
    refundPercentage: number;
    message: string;
  }> {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // Payment
  public static async processPayment(data: {
    bookingId: string;
    amount: number;
    method: string;
    cardDetails?: any;
    upiDetails?: any;
    simulateFailure?: boolean;
  }): Promise<{ payment: any; booking: Booking }> {
    return this.request('/payments/process', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Admin
  public static async getAdminStats(): Promise<{ stats: any }> {
    return this.request('/admin/dashboard-stats');
  }

  public static async getAdminBookings(params?: { status?: string; search?: string }): Promise<{ bookings: Booking[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/admin/bookings${qs}`);
  }

  public static async createShowtime(data: any): Promise<{ showtime: Showtime }> {
    return this.request('/admin/showtimes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
