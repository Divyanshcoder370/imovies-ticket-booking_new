# MVC Architectural Pattern

## 1. Architectural Layers Overview

IMovies adheres to a layered **Model-View-Controller (MVC)** architectural pattern adapted for modern TypeScript Single Page Applications and decoupled RESTful Express backends.

```mermaid
graph TD
    subgraph Client ["View Layer (Frontend)"]
        ReactViews["React Views & UI Components<br/>(MovieCatalog, BookingFlow, SeatMap)"]
        ApiClient["ApiClient (HTTP Service)"]
        ReactViews --> ApiClient
    end

    subgraph ServerRouter ["Router & Middleware Layer"]
        Routes["Express Routers<br/>(authRoutes, bookingRoutes, etc.)"]
        Middleware["Middleware Pipeline<br/>(authenticate, requireRole, errorHandler)"]
        ApiClient --> Routes
        Routes --> Middleware
    end

    subgraph ControllersLayer ["Controller Layer"]
        Controllers["Controllers<br/>(BookingController, AuthController, AdminController)"]
        Middleware --> Controllers
    end

    subgraph ServiceLayer ["Service Layer (Business Logic)"]
        Services["Domain Services<br/>(BookingService, AuthService, PaymentService)"]
        Controllers --> Services
    end

    subgraph ModelsLayer ["Model & Data Layer"]
        Models["Models & Types<br/>(Booking, SeatReservation, User, Showtime)"]
        Database["Database Store / Collections<br/>(MongoDB Collections)"]
        Services --> Models
        Services --> Database
    end

    Database -.->|Persisted State| Services
    Services -.->|Domain Entities| Controllers
    Controllers -.->|JSON Response| ApiClient
    ApiClient -.->|Renders State| ReactViews
```

---

## 2. Component Layer Responsibilities

### 2.1 Models (`server/models/types.ts`)
- **Responsibility**: Defines domain entities, types, relationships, and validation contracts.
- **Key Entities**:
  - `User`: Identity, role taxonomy (`guest`, `user`, `admin`), password hashes, and profiles.
  - `Movie`: Catalog titles, metadata, age classifications, and video trailer URLs.
  - `Cinema` & `Screen`: Physical venues, audio/visual capabilities, and seat matrix dimensions.
  - `Showtime`: Schedule associations between movies, screens, and tiered pricing.
  - `SeatReservation`: Individual seat state representation (`available`, `locked`, `booked`).
  - `Booking`: Customer order manifests, seat arrays, itemized fees, and status state machines.
  - `Payment`: Transaction ledgers, card last 4 digits, gateway references, and authorization codes.

### 2.2 Views (`src/components/`, `src/App.tsx`)
- **Responsibility**: Renders reactive UI, handles user input, communicates with the API, and enforces accessibility.
- **Key View Components**:
  - `App.tsx`: Main application shell, routing tabs, city selection context.
  - `Navbar.tsx`: Brand wordmark, city dropdown, navigation tabs, user persona switch.
  - `HeroFeatured.tsx`: Blockbuster spotlight with trailer CTA.
  - `MovieCatalog.tsx`: Filterable movie grid.
  - `MovieModal.tsx`: YouTube trailer player dialog.
  - `BookingFlow.tsx`: Multi-step seat map, snack upsells, checkout, and digital ticket pass.
  - `MyBookingsView.tsx`: Customer ticket portfolio and cancellation interface.
  - `AdminDashboard.tsx`: Executive operations dashboard and scheduler.
  - `DocumentationViewer.tsx`: In-app system and architecture specification explorer.

### 2.3 Controllers (`server/controllers/`)
- **Responsibility**: Unpacks HTTP requests, validates parameters, orchestrates domain services, and formats standard HTTP responses.
- **Controllers**:
  - `AuthController`: Manages user registration, login, and current profile (`/me`).
  - `MovieController`: Public queries with search/genre filters, and admin CRUD operations.
  - `CinemaController`: Venue listings, screens, and concessions catalog.
  - `ShowtimeController`: Film scheduling lookups and auditorium seat map generation.
  - `BookingController`: Seat hold requests, checkout creation, user bookings, reference lookups, and cancellations.
  - `PaymentController`: Multi-channel payment execution and transaction status queries.
  - `AdminController`: Dashboard operational metrics and showtime creation.

### 2.4 Routes (`server/routes/`)
- **Responsibility**: Maps URL paths and HTTP verbs to controller methods and applies route-specific middleware.
- **Route Definitions**:
  - `authRoutes.ts`: Mounted at `/api/v1/auth`
  - `movieRoutes.ts`: Mounted at `/api/v1/movies`
  - `cinemaRoutes.ts`: Mounted at `/api/v1/cinemas`
  - `showtimeRoutes.ts`: Mounted at `/api/v1/showtimes`
  - `bookingRoutes.ts`: Mounted at `/api/v1/bookings`
  - `paymentRoutes.ts`: Mounted at `/api/v1/payments`
  - `adminRoutes.ts`: Mounted at `/api/v1/admin`

### 2.5 Services (`server/services/`)
- **Responsibility**: Encapsulates pure business logic independent of the HTTP transport layer.
- **Services**:
  - `AuthService`: Password hashing with salt (SHA-256), HMAC-SHA256 JWT encoding, and decoding.
  - `BookingService`: Atomic seat locking with 10-minute hold expiry, fee calculation, convenience fees, and tiered refund percentage calculation.
  - `PaymentService`: Payment gateway simulation for cards, UPI, and wallets, with deterministic test scenarios and failure simulation.
  - `MovieSyncService`: External catalog mapping and metadata fallback.

### 2.6 Middleware (`server/middleware/`)
- **Responsibility**: Cross-cutting request processing, authentication, authorization, and error formatting.
- **Middleware Handlers**:
  - `authMiddleware.ts`: `authenticate` (requires valid Bearer token), `optionalAuth` (attaches token if present, permits anonymous), and `requireRole(roles)` (role-based access control).
  - `validationMiddleware.ts`: `validateRequiredFields(['title', 'rating'])` ensuring incoming payloads have necessary fields.
  - `errorHandlerMiddleware.ts`: Central error handler converting unhandled exceptions into uniform `{ success: false, error: message }` responses.

---

## 3. Booking Request Sequence Diagram

The following Mermaid sequence diagram details the end-to-end lifecycle of a customer booking request—from seat selection to lock reservation, payment settlement, and digital pass generation.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Browser)
    participant View as React UI (BookingFlow)
    participant Router as Express Router (/api/v1/bookings)
    participant AuthMid as Auth Middleware
    participant BookingCtrl as BookingController
    participant BookingSvc as BookingService
    participant PaymentCtrl as PaymentController
    participant PaymentSvc as PaymentService
    participant DB as MongoDB Collections

    Note over Customer,DB: Phase 1: 10-Minute Seat Reservation Hold
    Customer->>View: Selects seats (e.g. D5, D6) & clicks "Continue"
    View->>Router: POST /api/v1/bookings/hold { showtimeId, seatNumbers: ["D5", "D6"] }
    Router->>AuthMid: optionalAuth
    AuthMid-->>Router: Attach user or guest session
    Router->>BookingCtrl: holdSeats(req, res)
    BookingCtrl->>BookingSvc: holdSeats(showtimeId, ["D5", "D6"], userId)
    BookingSvc->>DB: Query seatReservations for D5, D6
    DB-->>BookingSvc: Return current seat status
    alt Seat already booked or held by other
        BookingSvc-->>BookingCtrl: Throw Error ("Seat is already on hold")
        BookingCtrl-->>View: HTTP 409 Conflict
        View-->>Customer: Display seat unavailable warning
    else Seats Available
        BookingSvc->>DB: Atomically update status: 'locked', expiresAt: now + 10min
        DB-->>BookingSvc: Seats updated
        BookingSvc-->>BookingCtrl: Return lockedSeats & expiresAt
        BookingCtrl-->>View: HTTP 200 OK { lockedSeats, expiresAt }
        View->>Customer: Start 10-Minute countdown banner in UI
    end

    Note over Customer,DB: Phase 2: Checkout & Payment Settlement
    Customer->>View: Selects Snacks, enters Card & clicks "Pay & Confirm"
    View->>Router: POST /api/v1/bookings/checkout { showtimeId, seatNumbers, concessions }
    Router->>BookingCtrl: createBooking(req, res)
    BookingCtrl->>BookingSvc: createBooking(params)
    BookingSvc->>DB: Insert booking (status: 'pending', ref: 'IMV-XXXXXX')
    DB-->>BookingSvc: Return pending booking
    BookingSvc-->>BookingCtrl: Return booking
    BookingCtrl-->>View: HTTP 201 Created { booking }

    View->>Router: POST /api/v1/payments/process { bookingId, amount, method, cardDetails }
    Router->>PaymentCtrl: processPayment(req, res)
    PaymentCtrl->>PaymentSvc: processPayment(params)
    PaymentSvc->>DB: Verify booking exists and status is 'pending'
    
    alt Card Decline Simulation Triggered
        PaymentSvc->>DB: Insert payment (status: 'failed')
        PaymentSvc-->>PaymentCtrl: Throw Error ("Transaction declined by bank")
        PaymentCtrl-->>View: HTTP 400 Bad Request
        View-->>Customer: Display bank decline message & retry button
    else Payment Succeeded
        PaymentSvc->>DB: Insert payment (status: 'completed', txnRef: 'TXN-CARD-XXXX')
        PaymentSvc->>BookingSvc: confirmBooking(bookingId, paymentId, method)
        BookingSvc->>DB: Update seats (status: 'booked', expiresAt: null)
        BookingSvc->>DB: Update booking (status: 'confirmed', paymentId)
        DB-->>PaymentSvc: Booking & Seats updated
        PaymentSvc-->>PaymentCtrl: Return completed payment
        PaymentCtrl-->>View: HTTP 200 OK { payment, booking }
        View-->>Customer: Display Confirmed Digital Ticket Pass with QR Code
    end
```
