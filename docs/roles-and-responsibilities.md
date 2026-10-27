# Roles and Responsibilities

## 1. Actor Definitions

The IMovies platform enforces distinct permissions across four primary roles:

### 1. Guest (Unauthenticated Visitor)
- An anonymous visitor browsing the platform.
- Can explore the movie catalog, filter by genre/status, search for titles, watch trailers, view cinema venues, inspect showtime schedules, and view auditorium seat maps.
- Can initiate a temporary 10-minute seat hold lock and complete guest checkout.
- Cannot view previous booking history or access administrative endpoints.

### 2. Registered User (Authenticated Customer)
- A registered patron who has authenticated with email and password or created an account.
- Possesses all Guest capabilities.
- Can view their active and past digital ticket passes in the "My Tickets" tab.
- Can initiate ticket cancellations and receive eligible refunds according to the cancellation policy.
- Access token carries `role: 'user'` in the JWT payload.

### 3. Administrator (Cinema Staff / Manager)
- An authorized staff member or theater operator with elevated privileges.
- Possesses all Registered User capabilities.
- Accesses the protected Admin Portal (`/api/v1/admin/*`).
- Can view operational KPIs: Gross Revenue, Total Bookings, Occupancy Rate, and Active Movies.
- Can schedule new showtimes for any film, cinema, and screen, which automatically provisions seat layout records.
- Can view and audit the full bookings ledger across all users and references.
- Can create, update, or remove movies from the master catalog.
- Access token carries `role: 'admin'` in the JWT payload, enforced by `requireRole(['admin'])`.

### 4. External Services
- **Simulated Payment Gateway**:
  - Receives transaction authorization requests.
  - Returns authorization codes, transaction references, and settlement timestamps.
  - Validates card numbers or UPI VPAs and simulates decline behaviors for test cards.
- **External Movie Data Adapter**:
  - Provides external film metadata (TMDB/IMDb schema mapping).
  - Supplies poster URLs, backdrop imagery, genre tags, and cast information.

---

## 2. Role-Permission Matrix

The table below outlines the exact authorization permissions matching the middleware rules in `server/middleware/authMiddleware.ts` and controller handlers.

| Action / Endpoint | Guest | Registered User | Administrator | Authorization Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Browse Movies** (`GET /api/v1/movies`) | ✅ | ✅ | ✅ | Public |
| **View Movie Details** (`GET /api/v1/movies/:id`) | ✅ | ✅ | ✅ | Public |
| **Search Movies** (`GET /api/v1/movies?search=...`) | ✅ | ✅ | ✅ | Public |
| **Browse Cinemas** (`GET /api/v1/cinemas`) | ✅ | ✅ | ✅ | Public |
| **View Cinema Details** (`GET /api/v1/cinemas/:id`) | ✅ | ✅ | ✅ | Public |
| **View Concessions** (`GET /api/v1/cinemas/concessions`) | ✅ | ✅ | ✅ | Public |
| **View Showtimes** (`GET /api/v1/showtimes`) | ✅ | ✅ | ✅ | Public |
| **View Seat Map** (`GET /api/v1/showtimes/:id/seats`) | ✅ | ✅ | ✅ | Public |
| **Hold Seats (10-Min)** (`POST /api/v1/bookings/hold`) | ✅ | ✅ | ✅ | `optionalAuth` |
| **Release Held Seats** (`POST /api/v1/bookings/release`) | ✅ | ✅ | ✅ | `optionalAuth` |
| **Create Booking** (`POST /api/v1/bookings/checkout`) | ✅ | ✅ | ✅ | `optionalAuth` |
| **Process Payment** (`POST /api/v1/payments/process`) | ✅ | ✅ | ✅ | `optionalAuth` |
| **View Ticket Pass** (`GET /api/v1/bookings/reference/:ref`) | ✅ | ✅ | ✅ | `optionalAuth` |
| **Register Account** (`POST /api/v1/auth/register`) | ✅ | ❌ | ❌ | Public |
| **Login** (`POST /api/v1/auth/login`) | ✅ | ✅ | ✅ | Public |
| **Get My Profile** (`GET /api/v1/auth/me`) | ❌ | ✅ | ✅ | `authenticate` |
| **View My Bookings** (`GET /api/v1/bookings/my`) | ❌ | ✅ | ✅ | `authenticate` |
| **Cancel My Booking** (`POST /api/v1/bookings/:id/cancel`) | ❌ | ✅ | ✅ | `authenticate` (User owns booking) |
| **View Admin Dashboard KPIs** (`GET /api/v1/admin/dashboard-stats`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **View Full Booking Audit Ledger** (`GET /api/v1/admin/bookings`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **Schedule New Showtime** (`POST /api/v1/admin/showtimes`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **Create New Movie** (`POST /api/v1/movies`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **Update Movie** (`PUT /api/v1/movies/:id`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **Delete Movie** (`DELETE /api/v1/movies/:id`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` |
| **Cancel Any User Booking** (`POST /api/v1/bookings/:id/cancel`) | ❌ | ❌ | ✅ | `requireRole(['admin'])` (Admin override) |

---

## 3. Security & Access Control Enforcement

1. **Authentication Token Verification**:
   - `authMiddleware.ts` extracts the Bearer token from the `Authorization` header.
   - If invalid or expired, the request is terminated with HTTP 401 Unauthorized.
2. **Role Enforcement**:
   - `requireRole(allowedRoles: UserRole[])` tests `req.user.role`.
   - If a standard user attempts to access `/api/v1/admin/*`, the server returns HTTP 403 Forbidden.
3. **Data Isolation**:
   - `BookingController.getMyBookings` filters bookings strictly where `booking.userId === req.user.userId`.
   - `BookingController.cancelBooking` verifies that `booking.userId === req.user.userId` or `req.user.role === 'admin'`.
