# REST API Documentation

The IMovies backend exposes a standardized RESTful API rooted at `/api/v1`. Responses follow the `{ success: boolean, ... }` convention with standard HTTP response codes.

---

## 1. System Health

### `GET /api/v1/health`
Returns operational health status.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "IMovies Movie Ticket Booking API",
  "version": "1.0.0",
  "timestamp": "2026-10-27T14:36:27.791Z"
}
```

---

## 2. Authentication API (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new customer account.
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1 555-0123"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "user": {
    "id": "usr_94b182",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "phone": "+1 555-0123",
    "createdAt": "2026-10-27T14:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `POST /api/v1/auth/login`
Authenticates user credentials and returns JWT bearer token.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@imovies.com",
  "password": "user123"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "usr_member",
    "name": "Sarah Connor",
    "email": "user@imovies.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `GET /api/v1/auth/me`
Retrieves current profile from `Authorization: Bearer <token>`.
- **Access**: Authenticated (`user` or `admin`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "usr_member",
    "name": "Sarah Connor",
    "email": "user@imovies.com",
    "role": "user"
  }
}
```

---

## 3. Movies API (`/api/v1/movies`)

### `GET /api/v1/movies`
Retrieves list of movies with optional filters.
- **Access**: Public
- **Query Parameters**:
  - `status`: `'now_showing'` | `'coming_soon'`
  - `genre`: e.g. `'Sci-Fi'`
  - `search`: Keyword for title, director, or cast
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 6,
  "movies": [
    {
      "id": "mov_dune2",
      "title": "Dune: Part Two",
      "rating": "PG-13",
      "score": 8.8,
      "durationMinutes": 166,
      "genres": ["Sci-Fi", "Adventure", "Drama"],
      "formatAvailable": ["IMAX 3D", "Dolby Atmos", "4K Laser"]
    }
  ]
}
```

### `GET /api/v1/movies/:id`
Retrieves full details for a single movie.
- **Access**: Public

### `POST /api/v1/movies`
Creates a new movie in the master catalog.
- **Access**: Restricted (`requireRole(['admin'])`)

---

## 4. Cinemas & Screens API (`/api/v1/cinemas`)

### `GET /api/v1/cinemas`
Lists cinema theater complexes.
- **Access**: Public
- **Query Parameters**: `city` (e.g. `'New York'`)

### `GET /api/v1/cinemas/:id`
Returns cinema profile and its hosted auditoriums/screens.

### `GET /api/v1/cinemas/:cinemaId/screens`
Returns auditoriums for a specific cinema.

### `GET /api/v1/cinemas/concessions`
Returns catalog of snacks, popcorn, and craft beverages.

---

## 5. Showtimes & Seat Maps API (`/api/v1/showtimes`)

### `GET /api/v1/showtimes`
Queries scheduled screenings.
- **Access**: Public
- **Query Parameters**: `movieId`, `cinemaId`, `date` (YYYY-MM-DD)

### `GET /api/v1/showtimes/:id/seats`
Returns the auditorium seat grid with real-time status.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "showtimeId": "st_1",
  "screen": {
    "name": "Auditorium 1 - IMAX Grand",
    "rows": 8,
    "cols": 10,
    "totalSeats": 80
  },
  "availableCount": 78,
  "lockedCount": 0,
  "bookedCount": 2,
  "seats": [
    {
      "id": "sr_st_1_D5",
      "seatNumber": "D5",
      "row": "D",
      "col": 5,
      "tier": "premium",
      "price": 20.0,
      "status": "available"
    }
  ]
}
```

---

## 6. Bookings API (`/api/v1/bookings`)

### `POST /api/v1/bookings/hold`
Locks requested seats for 10 minutes to prevent double-booking.
- **Access**: Public / Authenticated (`optionalAuth`)
- **Request Body**:
```json
{
  "showtimeId": "st_1",
  "seatNumbers": ["D5", "D6"]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "2 seat(s) held for 10 minutes",
  "expiresAt": "2026-10-27T14:40:00.000Z",
  "lockedSeats": [...]
}
```
- **Error `409 Conflict`**: Returned if a seat is already booked or held by another session.

### `POST /api/v1/bookings/release`
Releases a customer's held seats when navigating away.
- **Access**: Public / Authenticated

### `POST /api/v1/bookings/checkout`
Initializes a pending booking manifest before payment.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "showtimeId": "st_1",
  "seatNumbers": ["D5", "D6"],
  "concessions": [{ "id": "con_combo_couple", "quantity": 1 }],
  "discountCode": "IMOVIES10"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "booking": {
    "id": "bok_4812a0",
    "bookingReference": "IMV-681204",
    "subtotal": 58.50,
    "convenienceFee": 3.50,
    "discountAmount": 5.85,
    "taxAmount": 4.98,
    "totalAmount": 61.13,
    "status": "pending"
  }
}
```

### `GET /api/v1/bookings/my`
Returns booking history for the signed-in customer.
- **Access**: Authenticated (`authenticate`)

### `GET /api/v1/bookings/reference/:ref`
Returns confirmed ticket pass by booking reference code.
- **Access**: Public / Authenticated

### `POST /api/v1/bookings/:id/cancel`
Cancels booking and calculates refund eligibility.
- **Access**: Authenticated (Booking owner or `admin`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully. Refund status: $61.13 (100%)",
  "refundAmount": 61.13,
  "refundPercentage": 100
}
```

---

## 7. Payments API (`/api/v1/payments`)

### `POST /api/v1/payments/process`
Settles pending booking via simulated payment channel.
- **Access**: Public / Authenticated
- **Request Body**:
```json
{
  "bookingId": "bok_4812a0",
  "amount": 61.13,
  "method": "card",
  "cardDetails": {
    "cardNumber": "4242 4242 4242 4242",
    "cardHolder": "Sarah Connor",
    "expiry": "12/28",
    "cvv": "982"
  },
  "simulateFailure": false
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Payment completed successfully. Booking confirmed.",
  "payment": {
    "id": "pay_98a120",
    "transactionRef": "TXN-CARD-89FA14C0",
    "status": "completed",
    "amount": 61.13
  },
  "booking": {
    "id": "bok_4812a0",
    "status": "confirmed"
  }
}
```

---

## 8. Administration API (`/api/v1/admin`)

### `GET /api/v1/admin/dashboard-stats`
Returns operational metrics and recent transactions.
- **Access**: Restricted (`requireRole(['admin'])`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "stats": {
    "totalRevenue": 4820.50,
    "totalBookings": 42,
    "confirmedBookingsCount": 38,
    "occupancyRate": 64.2,
    "activeMoviesCount": 5
  }
}
```

### `GET /api/v1/admin/bookings`
Returns full booking audit ledger with search and status filtering.

### `POST /api/v1/admin/showtimes`
Schedules a new screening and provisions all auditorium seat records.
- **Access**: Restricted (`requireRole(['admin'])`)
