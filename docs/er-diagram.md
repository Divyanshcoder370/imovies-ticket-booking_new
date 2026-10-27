# Entity Relationship (ER) Diagram

## 1. Complete ER Diagram

The following Mermaid entity-relationship diagram illustrates the data models, cardinality, references, and attributes implemented across the IMovies platform.

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ PAYMENT : "submits"
    USER ||--o{ SEAT_RESERVATION : "temporarily holds"

    CINEMA ||--|{ SCREEN : "houses"
    CINEMA ||--o{ SHOWTIME : "schedules"

    SCREEN ||--o{ SHOWTIME : "hosts"

    MOVIE ||--o{ SHOWTIME : "featured in"

    SHOWTIME ||--|{ SEAT_RESERVATION : "allocates"
    SHOWTIME ||--o{ BOOKING : "booked for"

    BOOKING ||--o{ SEAT_RESERVATION : "contains"
    BOOKING ||--|| PAYMENT : "settled by"

    USER {
        string id PK
        string name
        string email UK "Unique index"
        string passwordHash
        string role "guest | user | admin"
        string phone
        string avatar
        string createdAt
    }

    MOVIE {
        string id PK
        string title
        string tagline
        string description
        string posterUrl
        string backdropUrl
        stringArray genres
        int durationMinutes
        string rating "PG, PG-13, R"
        float score
        string releaseDate
        string language
        string director
        stringArray cast
        string trailerUrl
        string status "now_showing | coming_soon"
        stringArray formatAvailable "IMAX, Dolby Atmos, 4K Laser"
        string createdAt
    }

    CINEMA {
        string id PK
        string name
        string city "New York, Los Angeles, Chicago, London"
        string location
        string address
        string phone
        stringArray amenities
        string imageUrl
    }

    SCREEN {
        string id PK
        string cinemaId FK "References CINEMA(id)"
        string name
        string screenType "IMAX 3D, Dolby Atmos, 4K Laser"
        int rows
        int cols
        int totalSeats
    }

    SHOWTIME {
        string id PK
        string movieId FK "References MOVIE(id)"
        string cinemaId FK "References CINEMA(id)"
        string screenId FK "References SCREEN(id)"
        string startTime "ISO 8601"
        string endTime "ISO 8601"
        string format
        float priceTierStandard
        float priceTierPremium
        float priceTierVip
    }

    SEAT_RESERVATION {
        string id PK
        string showtimeId FK "References SHOWTIME(id)"
        string seatNumber "e.g. D5"
        string row "e.g. D"
        int col "e.g. 5"
        string tier "standard | premium | vip"
        float price
        string status "available | locked | booked"
        string userId FK "Optional: References USER(id)"
        string bookingId FK "Optional: References BOOKING(id)"
        string lockedAt
        string expiresAt "Null if booked, ISO 8601 if locked"
    }

    BOOKING {
        string id PK
        string bookingReference UK "Unique index: e.g. IMV-784920"
        string userId FK "References USER(id)"
        string showtimeId FK "References SHOWTIME(id)"
        string movieId FK "References MOVIE(id)"
        string cinemaId FK "References CINEMA(id)"
        string screenId FK "References SCREEN(id)"
        stringArray seats "e.g. ['D5', 'D6']"
        float subtotal
        float convenienceFee
        float taxAmount
        float discountAmount
        float totalAmount
        string status "pending | confirmed | cancelled | refunded"
        string paymentId FK "References PAYMENT(id)"
        string paymentMethod "card | upi | wallet"
        string cancellationReason
        float refundAmount
        string createdAt
        string updatedAt
        string cancelledAt
    }

    PAYMENT {
        string id PK
        string bookingId FK "References BOOKING(id)"
        string userId FK "References USER(id)"
        float amount
        string currency "USD"
        string method "card | upi | netbanking | wallet"
        string status "initiated | completed | failed | refunded"
        string transactionRef UK "Unique index: e.g. TXN-CARD-98421045"
        string cardLast4
        string upiVpa
        string gatewayResponse
        string createdAt
        string updatedAt
    }
```

---

## 2. Entity Descriptions & Relationships

| Entity | Primary Key | Foreign Keys / References | Description |
| :--- | :--- | :--- | :--- |
| **User** | `id` | None | Stores registered account details, hashed passwords, roles (`guest`, `user`, `admin`), and contact information. |
| **Movie** | `id` | None | Master catalog of films, including synopses, posters, duration, age rating, IMDb/Rotten score, and trailer embed URLs. |
| **Cinema** | `id` | None | Physical cinema theater venue, location details, municipal address, telephone, and venue amenities (IMAX Laser, VIP Lounge, Dine-in). |
| **Screen** | `id` | `cinemaId` $\to$ `Cinema.id` | Individual auditorium within a cinema complex, defining physical layout dimensions (rows $\times$ cols), total capacity, and projection technology. |
| **Showtime** | `id` | `movieId` $\to$ `Movie.id`<br/>`cinemaId` $\to$ `Cinema.id`<br/>`screenId` $\to$ `Screen.id` | A scheduled screening of a film in a specific auditorium at a designated start and end time with tiered ticket pricing. |
| **SeatReservation** | `id` | `showtimeId` $\to$ `Showtime.id`<br/>`userId` $\to$ `User.id`<br/>`bookingId` $\to$ `Booking.id` | Represents individual seat states (`available`, `locked`, `booked`). Holds temporary concurrency locks (`expiresAt`) during checkout. |
| **Booking** | `id` | `userId` $\to$ `User.id`<br/>`showtimeId` $\to$ `Showtime.id`<br/>`paymentId` $\to$ `Payment.id` | Order manifest recording selected seats, optional concessions, financial calculation (fees, taxes, discounts), reference codes, and status. |
| **Payment** | `id` | `bookingId` $\to$ `Booking.id`<br/>`userId` $\to$ `User.id` | Transaction record detailing gateway settlement, method (Card, UPI, Wallet), last 4 digits, status, and bank authorization codes. |

---

## 3. Database Indexes, Unique Constraints, and Integrity Rules

### 3.1 Unique Indexes
1. **`users.email`**:
   - Unique constraint enforcing that each registered account possesses a distinct email address. Case-insensitive lowercase collation.
2. **`bookings.bookingReference`**:
   - Unique alphanumeric constraint in format `IMV-XXXXXX` (e.g., `IMV-784920`) ensuring ticket lookup idempotence and fraud prevention.
3. **`payments.transactionRef`**:
   - Unique reference identifier (e.g., `TXN-CARD-98421045`) generated per transaction attempt to prevent double-charging.
4. **`seatReservations.showtimeId + seatNumber` (Composite Unique Index)**:
   - Ensures that within a given showtime, no two records can exist for the same physical seat (e.g., `Showtime: st_1, Seat: D5`).

### 3.2 Concurrency & Referential Integrity Constraints
- **Atomic Seat Lock Check**: Before transitioning a seat to `locked` or `booked`, the system queries the composite key `(showtimeId, seatNumber)`. If `status === 'booked'` or (`status === 'locked'` and `userId !== currentUserId` and `expiresAt > now`), the operation fails with HTTP 409.
- **Cascade Release on Expiry**: If `expiresAt < now`, the seat automatically reverts to `available` and clears `userId` and `lockedAt`.
- **Foreign Key Referencing**:
  - `Showtime` requires existing `Movie`, `Cinema`, and `Screen` IDs.
  - `Booking` references valid `Showtime` and `User` IDs.
  - `Payment` requires a corresponding `Booking` in `pending` status.
