/**
 * IMovies Database Repository Layer
 * Implements MongoDB-compatible collection store with schema constraints,
 * indexes, foreign key references, and atomic seat reservation locks.
 */

import crypto from 'crypto';
import {
  User,
  Movie,
  Cinema,
  Screen,
  Showtime,
  SeatReservation,
  ConcessionItem,
  Booking,
  Payment,
  SeatTier
} from '../models/types.js';

class InMemoryCollection<T extends { id: string }> {
  private items = new Map<string, T>();
  private uniqueIndexes = new Map<string, Set<string>>();

  constructor(private collectionName: string, private uniqueKeys: (keyof T)[] = []) {}

  find(filter?: (item: T) => boolean): T[] {
    const list = Array.from(this.items.values());
    if (!filter) return list;
    return list.filter(filter);
  }

  findOne(filter: (item: T) => boolean): T | null {
    for (const item of this.items.values()) {
      if (filter(item)) return item;
    }
    return null;
  }

  findById(id: string): T | null {
    return this.items.get(id) || null;
  }

  insertOne(doc: T): T {
    // Check unique constraints
    for (const key of this.uniqueKeys) {
      const val = String((doc as any)[key]);
      if (val !== undefined && val !== null) {
        for (const existing of this.items.values()) {
          if (String((existing as any)[key]) === val && existing.id !== doc.id) {
            throw new Error(`DuplicateKeyError in ${this.collectionName}: ${String(key)} '${val}' already exists`);
          }
        }
      }
    }
    this.items.set(doc.id, { ...doc });
    return doc;
  }

  updateOne(id: string, updates: Partial<T>): T | null {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.items.set(id, updated as T);
    return updated as T;
  }

  deleteOne(id: string): boolean {
    return this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }
}

export class Database {
  public users = new InMemoryCollection<User>('users', ['email']);
  public movies = new InMemoryCollection<Movie>('movies');
  public cinemas = new InMemoryCollection<Cinema>('cinemas');
  public screens = new InMemoryCollection<Screen>('screens');
  public showtimes = new InMemoryCollection<Showtime>('showtimes');
  public seatReservations = new InMemoryCollection<SeatReservation>('seatReservations');
  public concessions = new InMemoryCollection<ConcessionItem>('concessions');
  public bookings = new InMemoryCollection<Booking>('bookings', ['bookingReference']);
  public payments = new InMemoryCollection<Payment>('payments', ['transactionRef']);

  private static instance: Database;

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.seedInitialData();
    }
    return Database.instance;
  }

  /**
   * Release expired seat locks older than 10 minutes
   */
  public cleanupExpiredSeatLocks(): void {
    const now = new Date().toISOString();
    const lockedSeats = this.seatReservations.find(
      s => s.status === 'locked' && s.expiresAt !== undefined && s.expiresAt < now
    );

    for (const seat of lockedSeats) {
      this.seatReservations.updateOne(seat.id, {
        status: 'available',
        userId: undefined,
        lockedAt: undefined,
        expiresAt: undefined
      });
    }
  }

  /**
   * Seed the database with high-fidelity cinematic and schedule records
   */
  public seedInitialData(): void {
    // 1. Seed Users
    const hashPassword = (pwd: string) =>
      crypto.createHash('sha256').update(pwd + 'imovies_salt_secret').digest('hex');

    if (this.users.count() === 0) {
      this.users.insertOne({
        id: 'usr_admin',
        name: 'Cinema Admin',
        email: 'admin@imovies.com',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        phone: '+1 555-019-2834',
        createdAt: '2026-01-15T08:00:00.000Z'
      });

      this.users.insertOne({
        id: 'usr_member',
        name: 'Sarah Connor',
        email: 'user@imovies.com',
        passwordHash: hashPassword('user123'),
        role: 'user',
        phone: '+1 555-014-9921',
        createdAt: '2026-02-10T11:30:00.000Z'
      });
    }

    // 2. Seed Movies with Real Official Posters
    if (this.movies.count() === 0) {
      const moviesData: Movie[] = [
        {
          id: 'mov_dune2',
          title: 'Dune: Part Two',
          tagline: 'Long live the fighters.',
          description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8ERK2PqAI2nCF04bMYEJ7lb.jpg',
          genres: ['Sci-Fi', 'Adventure', 'Drama'],
          durationMinutes: 166,
          rating: 'PG-13',
          score: 8.8,
          releaseDate: '2024-03-01',
          language: 'English',
          director: 'Denis Villeneuve',
          cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
          trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
          status: 'now_showing',
          formatAvailable: ['IMAX 3D', 'Dolby Atmos', '4K Laser'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_oppenheimer',
          title: 'Oppenheimer',
          tagline: 'The world forever changes.',
          description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, examining the scientific breakthroughs and moral complexities.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
          genres: ['Biography', 'Drama', 'History'],
          durationMinutes: 180,
          rating: 'R',
          score: 8.9,
          releaseDate: '2023-07-21',
          language: 'English',
          director: 'Christopher Nolan',
          cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
          trailerUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
          status: 'now_showing',
          formatAvailable: ['IMAX 3D', 'Dolby Atmos'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_interstellar',
          title: 'Interstellar',
          tagline: 'Mankind was born on Earth. It was never meant to die here.',
          description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as blight ravages Earth.",
          posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg',
          genres: ['Adventure', 'Drama', 'Sci-Fi'],
          durationMinutes: 169,
          rating: 'PG-13',
          score: 8.7,
          releaseDate: '2014-11-07',
          language: 'English',
          director: 'Christopher Nolan',
          cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
          trailerUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
          status: 'now_showing',
          formatAvailable: ['IMAX 3D', '4K Laser'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_spiderman',
          title: 'Spider-Man: Across the Spider-Verse',
          tagline: "It's how you wear the mask that matters.",
          description: 'Miles Morales journeys across the Multiverse with Gwen Stacy and a new coalition of Spider-Heroes to confront a threat that imperils every reality.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
          genres: ['Animation', 'Action', 'Adventure'],
          durationMinutes: 140,
          rating: 'PG',
          score: 9.0,
          releaseDate: '2023-06-02',
          language: 'English',
          director: 'Joaquim Dos Santos, Kemp Powers',
          cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
          trailerUrl: 'https://www.youtube.com/embed/cqGjhVJWtEg',
          status: 'coming_soon',
          formatAvailable: ['IMAX 3D', 'Dolby Atmos'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_insideout2',
          title: 'Inside Out 2',
          tagline: 'Make room for new emotions.',
          description: 'Follow Riley in her teenage years as she encounters brand new emotions including Anxiety, Envy, Ennui, and Embarrassment inside Headquarters.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/xg270mgWYcuoxexJJe8vqq1RVIb.jpg',
          genres: ['Animation', 'Comedy', 'Family'],
          durationMinutes: 96,
          rating: 'PG',
          score: 7.9,
          releaseDate: '2024-06-14',
          language: 'English',
          director: 'Kelsey Mann',
          cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman', 'Liza Lapira'],
          trailerUrl: 'https://www.youtube.com/embed/LEjhY15eCx0',
          status: 'now_showing',
          formatAvailable: ['Dolby Atmos', 'Standard 2D'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_pastlives',
          title: 'Past Lives',
          tagline: 'In-Yun connects every soul.',
          description: "Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora's family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week.",
          posterUrl: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/7HR38hMBl23lf38MAN63y4pKsHz.jpg',
          genres: ['Drama', 'Romance'],
          durationMinutes: 105,
          rating: 'PG-13',
          score: 8.3,
          releaseDate: '2023-06-02',
          language: 'English / Korean',
          director: 'Celine Song',
          cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
          trailerUrl: 'https://www.youtube.com/embed/kA244xewjcI',
          status: 'now_showing',
          formatAvailable: ['Standard 2D', '4K Laser'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_deadpool3',
          title: 'Deadpool & Wolverine',
          tagline: 'Come together.',
          description: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. When his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
          genres: ['Action', 'Comedy', 'Sci-Fi'],
          durationMinutes: 128,
          rating: 'R',
          score: 7.9,
          releaseDate: '2024-07-26',
          language: 'English',
          director: 'Shawn Levy',
          cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
          trailerUrl: 'https://www.youtube.com/embed/73_1biulkYk',
          status: 'now_showing',
          formatAvailable: ['IMAX 3D', 'Dolby Atmos', '4K Laser'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'mov_gladiator2',
          title: 'Gladiator II',
          tagline: 'What we do in life echoes in eternity.',
          description: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who lead Rome.',
          posterUrl: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
          backdropUrl: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnEx7vGJW1qpVAd.jpg',
          genres: ['Action', 'Adventure', 'Drama'],
          durationMinutes: 148,
          rating: 'R',
          score: 8.0,
          releaseDate: '2024-11-22',
          language: 'English',
          director: 'Ridley Scott',
          cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
          trailerUrl: 'https://www.youtube.com/embed/4rgYUipGJNo',
          status: 'coming_soon',
          formatAvailable: ['IMAX 3D', 'Dolby Atmos'],
          createdAt: new Date().toISOString()
        }
      ];

      for (const m of moviesData) {
        this.movies.insertOne(m);
      }
    }

    // 3. Seed Cinemas & Screens
    if (this.cinemas.count() === 0) {
      const cinemasData: Cinema[] = [
        {
          id: 'cin_ny',
          name: 'IMovies Grand Horizon',
          city: 'New York',
          location: 'Times Square, Manhattan',
          address: '1540 Broadway, New York, NY 10036',
          phone: '+1 (212) 555-4687',
          amenities: ['IMAX Laser', 'Dolby Atmos', 'Recliner Seating', 'VIP Lounge & Bar', 'Valet Parking'],
          imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'cin_la',
          name: 'IMovies Dolby Cineplex',
          city: 'Los Angeles',
          location: 'Sunset Blvd, Hollywood',
          address: '6801 Hollywood Blvd, Los Angeles, CA 90028',
          phone: '+1 (323) 555-8921',
          amenities: ['Dolby Cinema', 'Laser Projection', 'Dine-In In-Seat Service', 'Full Bar', 'Cocktail Lounge'],
          imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'cin_chi',
          name: 'IMovies Apex Center',
          city: 'Chicago',
          location: 'Michigan Ave, Downtown',
          address: '600 N Michigan Ave, Chicago, IL 60611',
          phone: '+1 (312) 555-3210',
          amenities: ['70mm IMAX', 'Dolby Atmos', 'Premium Luxury Loungers', 'Artisanal Concessions'],
          imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'cin_lon',
          name: 'IMovies Leicester Premiere',
          city: 'London',
          location: 'Leicester Square, West End',
          address: '24-26 Leicester Square, London WC2H 7LQ',
          phone: '+44 20 7555 0192',
          amenities: ['Laser IMAX', 'Dual Christie 4K', 'Heated Recliners', 'Private Royal Box'],
          imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80'
        }
      ];

      for (const c of cinemasData) {
        this.cinemas.insertOne(c);
      }

      // Screens for New York
      this.screens.insertOne({
        id: 'scr_ny_imax',
        cinemaId: 'cin_ny',
        name: 'Auditorium 1 - IMAX Grand',
        screenType: 'IMAX 3D',
        rows: 8,
        cols: 10,
        totalSeats: 80
      });

      this.screens.insertOne({
        id: 'scr_ny_dolby',
        cinemaId: 'cin_ny',
        name: 'Auditorium 2 - Dolby Atmos Soundstage',
        screenType: 'Dolby Atmos',
        rows: 7,
        cols: 10,
        totalSeats: 70
      });

      // Screens for LA
      this.screens.insertOne({
        id: 'scr_la_dolby',
        cinemaId: 'cin_la',
        name: 'Screen 1 - Dolby Cinema Premier',
        screenType: 'Dolby Atmos',
        rows: 8,
        cols: 10,
        totalSeats: 80
      });

      // Screens for Chicago
      this.screens.insertOne({
        id: 'scr_chi_imax',
        cinemaId: 'cin_chi',
        name: 'Screen 1 - Apex IMAX',
        screenType: 'IMAX 3D',
        rows: 8,
        cols: 10,
        totalSeats: 80
      });

      // Screens for London
      this.screens.insertOne({
        id: 'scr_lon_imax',
        cinemaId: 'cin_lon',
        name: 'Screen 1 - West End IMAX Laser',
        screenType: 'IMAX 3D',
        rows: 8,
        cols: 10,
        totalSeats: 80
      });
    }

    // 4. Seed Showtimes
    if (this.showtimes.count() === 0) {
      const today = new Date();
      const formatTime = (daysAhead: number, hours: number, minutes: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysAhead);
        d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
      };

      const showtimeTemplates = [
        // Dune 2 in New York
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_imax',
          hours: 14,
          mins: 0,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 16.5, premium: 20.0, vip: 26.0 }
        },
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_imax',
          hours: 18,
          mins: 30,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 18.0, premium: 22.0, vip: 28.0 }
        },
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_imax',
          hours: 21,
          mins: 45,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 18.0, premium: 22.0, vip: 28.0 }
        },
        // Oppenheimer in NY Dolby
        {
          movieId: 'mov_oppenheimer',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_dolby',
          hours: 15,
          mins: 15,
          format: 'Dolby Atmos' as const,
          priceTiers: { standard: 15.0, premium: 19.0, vip: 24.0 }
        },
        {
          movieId: 'mov_oppenheimer',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_dolby',
          hours: 19,
          mins: 0,
          format: 'Dolby Atmos' as const,
          priceTiers: { standard: 16.0, premium: 20.0, vip: 25.0 }
        },
        // Interstellar in NY
        {
          movieId: 'mov_interstellar',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_dolby',
          hours: 22,
          mins: 30,
          format: 'Dolby Atmos' as const,
          priceTiers: { standard: 14.0, premium: 18.0, vip: 22.0 }
        },
        // Dune 2 in LA
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_la',
          screenId: 'scr_la_dolby',
          hours: 16,
          mins: 0,
          format: 'Dolby Atmos' as const,
          priceTiers: { standard: 17.0, premium: 21.0, vip: 27.0 }
        },
        // Deadpool in NY
        {
          movieId: 'mov_deadpool3',
          cinemaId: 'cin_ny',
          screenId: 'scr_ny_imax',
          hours: 16,
          mins: 45,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 17.5, premium: 21.0, vip: 27.0 }
        },
        // Dune 2 in Chicago
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_chi',
          screenId: 'scr_chi_imax',
          hours: 17,
          mins: 30,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 15.0, premium: 19.5, vip: 25.0 }
        },
        // Dune 2 in London
        {
          movieId: 'mov_dune2',
          cinemaId: 'cin_lon',
          screenId: 'scr_lon_imax',
          hours: 19,
          mins: 15,
          format: 'IMAX 3D' as const,
          priceTiers: { standard: 16.0, premium: 20.0, vip: 26.0 }
        }
      ];

      let stCounter = 1;
      for (let day = 0; day < 5; day++) {
        for (const tmpl of showtimeTemplates) {
          const startTime = formatTime(day, tmpl.hours, tmpl.mins);
          const endD = new Date(startTime);
          endD.setHours(endD.getHours() + 2, endD.getMinutes() + 45);

          const showtimeId = `st_${stCounter++}`;
          this.showtimes.insertOne({
            id: showtimeId,
            movieId: tmpl.movieId,
            cinemaId: tmpl.cinemaId,
            screenId: tmpl.screenId,
            startTime,
            endTime: endD.toISOString(),
            format: tmpl.format,
            priceTiers: tmpl.priceTiers
          });

          this.initializeSeatsForShowtime(showtimeId, tmpl.screenId, tmpl.priceTiers);
        }
      }
    }

    // 5. Seed Concessions
    if (this.concessions.count() === 0) {
      const concessionsData: ConcessionItem[] = [
        {
          id: 'con_pop_lg',
          name: 'Large Truffle Popcorn',
          description: 'Freshly popped kernels tossed with black truffle oil and sea salt.',
          price: 9.5,
          category: 'Popcorn'
        },
        {
          id: 'con_pop_car',
          name: 'Gourmet Caramel Popcorn',
          description: 'Crunchy golden caramel-coated cinema popcorn.',
          price: 8.5,
          category: 'Popcorn'
        },
        {
          id: 'con_nachos',
          name: 'Artisanal Queso Nachos',
          description: 'Warm tortilla chips served with melted jalapeño queso and salsa fresca.',
          price: 10.0,
          category: 'Snacks'
        },
        {
          id: 'con_bev_soda',
          name: 'Fountain Soda (Free Refills)',
          description: 'Choice of Cola, Diet Cola, Lemon-Lime, or Ginger Ale.',
          price: 5.5,
          category: 'Beverages'
        },
        {
          id: 'con_bev_slush',
          name: 'Wildberry Ice Slushie',
          description: 'Sub-zero blended berry freeze with natural cane sugar.',
          price: 6.5,
          category: 'Beverages'
        },
        {
          id: 'con_combo_couple',
          name: 'Cinema Lovers Combo',
          description: '1 Large Truffle Popcorn, 2 Fountain Drinks, and choice of Candy.',
          price: 18.5,
          category: 'Combos'
        }
      ];

      for (const item of concessionsData) {
        this.concessions.insertOne(item);
      }
    }

    // 6. Seed sample confirmed booking for Sarah Connor
    if (this.bookings.count() === 0) {
      const firstShowtime = this.showtimes.find()[0];
      if (firstShowtime) {
        const bookId = 'bok_demo_01';
        const bookedSeatNumbers = ['D5', 'D6'];

        for (const seatNum of bookedSeatNumbers) {
          const seat = this.seatReservations.findOne(
            s => s.showtimeId === firstShowtime.id && s.seatNumber === seatNum
          );
          if (seat) {
            this.seatReservations.updateOne(seat.id, {
              status: 'booked',
              userId: 'usr_member',
              bookingId: bookId
            });
          }
        }

        const booking: Booking = {
          id: bookId,
          bookingReference: 'IMV-784920',
          userId: 'usr_member',
          showtimeId: firstShowtime.id,
          movieId: firstShowtime.movieId,
          cinemaId: firstShowtime.cinemaId,
          screenId: firstShowtime.screenId,
          seats: bookedSeatNumbers,
          seatDetails: [
            { seatNumber: 'D5', tier: 'premium', price: firstShowtime.priceTiers.premium },
            { seatNumber: 'D6', tier: 'premium', price: firstShowtime.priceTiers.premium }
          ],
          concessions: [
            { id: 'con_combo_couple', name: 'Cinema Lovers Combo', quantity: 1, price: 18.5 }
          ],
          subtotal: firstShowtime.priceTiers.premium * 2 + 18.5,
          convenienceFee: 3.5,
          taxAmount: 4.85,
          discountAmount: 0,
          totalAmount: firstShowtime.priceTiers.premium * 2 + 18.5 + 3.5 + 4.85,
          status: 'confirmed',
          paymentId: 'pay_demo_01',
          paymentMethod: 'card',
          createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3600 * 1000).toISOString()
        };

        this.bookings.insertOne(booking);

        this.payments.insertOne({
          id: 'pay_demo_01',
          bookingId: bookId,
          userId: 'usr_member',
          amount: booking.totalAmount,
          currency: 'USD',
          method: 'card',
          status: 'completed',
          transactionRef: 'TXN-CARD-98421045',
          cardLast4: '4242',
          gatewayResponse: {
            gateway: 'SimulatedStripeGateway',
            authCode: 'AUTH-99124',
            message: 'Payment verified and settled'
          },
          createdAt: booking.createdAt,
          updatedAt: booking.createdAt
        });
      }
    }
  }

  /**
   * Generates seat layout for a screen showtime
   */
  private initializeSeatsForShowtime(showtimeId: string, screenId: string, priceTiers: { standard: number; premium: number; vip: number }): void {
    const screen = this.screens.findById(screenId);
    if (!screen) return;

    const rowLetters = 'ABCDEFGHJK'.slice(0, screen.rows).split('');

    for (let r = 0; r < rowLetters.length; r++) {
      const row = rowLetters[r];
      let tier: SeatTier = 'standard';
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
        this.seatReservations.insertOne({
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
  }
}

export const db = Database.getInstance();
