# Features Specification

## 1. Implemented Features Matrix

The table below catalogs all features implemented in the IMovies application, categorized by domain and implementation status.

| Feature Domain | Feature Name | Description | Status | Source Location |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | User Registration | Allows new customers to register with Name, Email, Password, and Phone. | Implemented | `server/controllers/authController.ts`, `src/components/AuthModal.tsx` |
| **Authentication** | User Login | Authenticates registered users with SHA-256 hashed passwords and issues HMAC-SHA256 JWT tokens. | Implemented | `server/services/authService.ts` |
| **Authentication** | Persona Fast-Switcher | Quick login for pre-seeded member (`user@imovies.com`) and admin (`admin@imovies.com`). | Implemented | `src/components/Navbar.tsx`, `src/components/AuthModal.tsx` |
| **Authentication** | Current User Profile (`/me`) | Returns the authenticated user's profile and assigned role. | Implemented | `server/routes/authRoutes.ts` |
| **Movie Discovery** | Featured Blockbuster Hero | Large visual banner with movie synopsis, trailer trigger, and booking CTA. | Implemented | `src/components/HeroFeatured.tsx` |
| **Movie Discovery** | Filter by Status | Toggles between "Now Showing" and "Coming Soon" movies. | Implemented | `src/components/MovieCatalog.tsx` |
| **Movie Discovery** | Filter by Genre | Filter films across genres (Sci-Fi, Action, Drama, Animation, etc.). | Implemented | `server/controllers/movieController.ts`, `src/components/MovieCatalog.tsx` |
| **Movie Discovery** | Live Search Bar | Real-time search across movie title, director, and cast members. | Implemented | `server/controllers/movieController.ts`, `src/components/MovieCatalog.tsx` |
| **Movie Discovery** | Trailer Preview Modal | Embedded YouTube video preview with synopsis, cast, and age rating. | Implemented | `src/components/MovieModal.tsx` |
| **Cinemas** | Multi-City Theaters | Cinema venues across New York, Los Angeles, Chicago, and London. | Implemented | `server/controllers/cinemaController.ts`, `src/components/Navbar.tsx` |
| **Cinemas** | Auditorium Amenities | Displays venue details: IMAX Laser, Dolby Atmos, VIP Lounge, Dine-in. | Implemented | `src/App.tsx` (Cinemas Tab) |
| **Seat Reservation** | 5-Day Schedule Picker | Interactive day selector for Today and the following 4 days. | Implemented | `src/components/BookingFlow.tsx` |
| **Seat Reservation** | Screen Format Tagging | Showtimes tagged with projection format (IMAX 3D, Dolby Atmos, 4K Laser). | Implemented | `server/models/types.ts`, `src/components/BookingFlow.tsx` |
| **Seat Reservation** | Curved Cinema Seat Map | Visual screen curvature with 8 rows of seats (A to H) and column numbering. | Implemented | `src/components/BookingFlow.tsx` |
| **Seat Reservation** | Multi-Tier Pricing | Three seat tiers with tiered pricing: Standard, Premium, and VIP Recliners. | Implemented | `server/db/database.ts`, `src/components/BookingFlow.tsx` |
| **Seat Reservation** | 10-Minute Hold Lock | Locks selected seats for 10 minutes with server expiration timestamps. | Implemented | `server/services/bookingService.ts` |
| **Seat Reservation** | Live Countdown Timer | Visual MM:SS countdown banner alerting the customer before seats expire. | Implemented | `src/components/BookingFlow.tsx` |
| **Seat Reservation** | Auto-Release Cleanup | Periodic background task (every 30s) automatically frees expired seats. | Implemented | `server.ts`, `server/db/database.ts` |
| **Concessions** | Snack & Drink Selection | Gourmet popcorn, queso nachos, sodas, and combos with quantity steppers. | Implemented | `src/components/BookingFlow.tsx` |
| **Booking & Checkout** | Itemized Order Breakdown | Calculates ticket subtotal, snacks, convenience fees ($1.75/seat), and tax (8.875%). | Implemented | `server/services/bookingService.ts` |
| **Booking & Checkout** | Promo Discount Code | Supports code `IMOVIES10` for an instant 10% discount. | Implemented | `server/services/bookingService.ts`, `src/components/BookingFlow.tsx` |
| **Booking & Checkout** | Anonymous / Guest Checkout | Allows checkout without pre-registration, assigning a guest reference. | Implemented | `server/routes/bookingRoutes.ts` |
| **Payment** | Multi-Channel Simulation | Supports Credit/Debit Cards, UPI Instant VPA, and Cinema Loyalty Wallet. | Simulated | `server/services/paymentService.ts`, `src/components/BookingFlow.tsx` |
| **Payment** | Test Credentials Autofill | One-click buttons to fill valid test card and test UPI identifiers. | Implemented | `src/components/BookingFlow.tsx` |
| **Payment** | Decline / Error Rollback | Checkbox to simulate bank authorization decline to test error handling. | Implemented | `server/services/paymentService.ts` |
| **Ticket Issuance** | Digital Ticket Pass | High-fidelity printable ticket pass with perforated styling and reference. | Implemented | `src/components/BookingFlow.tsx` |
| **Ticket Issuance** | Scannable Barcode / QR | Generated QR code graphic and human-readable booking reference. | Implemented | `src/components/BookingFlow.tsx` |
| **Ticket Issuance** | Print / Save to PDF | Native `window.print()` integration for physical ticket vouchers. | Implemented | `src/components/BookingFlow.tsx` |
| **Ticket Management** | User Tickets List | View upcoming and past movie reservations under "My Tickets". | Implemented | `src/components/MyBookingsView.tsx` |
| **Ticket Management** | Cancellation & Refunds | Cancellation policy: 100% refund (>2h before show), 50% (1-2h), 0% (<1h). | Implemented | `server/services/bookingService.ts` |
| **Administration** | Real-Time KPI Metrics | Live dashboard with Gross Revenue, Total Bookings, Occupancy %, and Active Movies. | Implemented | `server/controllers/adminController.ts`, `src/components/AdminDashboard.tsx` |
| **Administration** | Showtime Scheduler | Form to schedule new movie screenings on specific screens and generate seat inventory. | Implemented | `server/controllers/adminController.ts`, `src/components/AdminDashboard.tsx` |
| **Administration** | Booking Audit Ledger | Searchable ledger of all bookings with status filter and customer identities. | Implemented | `src/components/AdminDashboard.tsx` |
| **Documentation** | In-App Doc Explorer | Live in-browser viewer for all 6 architecture and system documentation files. | Implemented | `src/components/DocumentationViewer.tsx` |

---

## 2. Distinction Between Implemented vs. Simulated Functionality

To ensure transparency, the following technical distinctions apply to the codebase:

### 2.1 Fully Implemented Functionality
- **Express Backend & Route Controllers**: All HTTP endpoints (`/api/v1/auth`, `/api/v1/movies`, `/api/v1/cinemas`, `/api/v1/showtimes`, `/api/v1/bookings`, `/api/v1/payments`, `/api/v1/admin`) are live and operational.
- **Concurrency Control & Seat Locks**: The 10-minute hold lock mechanism (`SEAT_LOCK_DURATION_MS = 600,000 ms`), composite uniqueness checks, and background auto-expiry reap loop in `server.ts` are functional.
- **JWT Authentication**: Full HMAC-SHA256 token generation, header verification, and role guard middleware (`requireRole(['admin'])`) are implemented.
- **Refund Logic**: Tiered refund calculation (100% $>2\text{h}$, 50% $1\text{--}2\text{h}$, 0% $<1\text{h}$) is computed in `BookingService.cancelBooking()`.

### 2.2 Simulated Functionality
- **Payment Processing**: The payment gateway (`PaymentService`) is simulated. It executes full transaction lifecycle modeling, generates valid transaction references (`TXN-CARD-XXXX`, `TXN-UPI-XXXX`), and handles success/failure states without charging real currency or calling live Stripe/Razorpay credit card networks.
- **External Movie Data Sync**: `MovieSyncService` provides an adapter for external movie APIs (e.g. TMDB) with pre-seeded data for 6 films to ensure reliability without third-party network flakiness.
- **Database Storage**: The application default runs an in-memory document store repository with MongoDB-compatible collection APIs, index uniqueness enforcement, and relationship resolution. If a `MONGODB_URI` environment variable is supplied, an external MongoDB cluster can be connected.
