# IMovies - Movie Ticket Booking Platform

A full-stack, real-time movie ticket booking web application with interactive seat maps, multi-tier pricing, 10-minute hold concurrency locking, simulated multi-channel payments, and comprehensive system architecture documentation.

---

## 🌟 Key Features

1. **Movie Discovery & Catalog**:
   - Filter by status ("Now Showing" vs "Coming Soon") and genres (Sci-Fi, Action, Drama, Animation).
   - Real-time search across titles, directors, and cast members.
   - Cinematic trailer previews with YouTube embeds and synopses.

2. **Cinema & Auditorium Scheduling**:
   - Multi-city cinema complexes (New York, Los Angeles, Chicago, London).
   - Screening format indicators: IMAX 3D, Dolby Atmos, and 4K Laser.
   - 5-day calendar date selector.

3. **Interactive Curved Seat Map & Concurrency Control**:
   - Visual cinema screen curvature with realistic acoustic auditorium geometry.
   - Three seat tiers: Standard, Premium, and VIP Recliners.
   - Real-time seat status indicators: Available, Selected, Booked, and Locked.
   - **10-Minute Hold Reservation Lock**: Atomic server-side lock with a live countdown timer preventing double-booking race conditions.
   - Automatic background reap job releasing expired seat locks every 30 seconds.

4. **Concessions & Add-Ons**:
   - Gourmet cinema snacks, truffle popcorn, queso nachos, beverages, and combo deals with steppers.

5. **Simulated Multi-Channel Checkout**:
   - Itemized order breakdown (ticket subtotal, snacks, $1.75/ticket convenience fee, 8.875% tax).
   - Coupon discount code support (`IMOVIES10` for 10% off).
   - Multi-channel payment simulation: Credit/Debit Card (with "Use Test Card"), UPI (with "Use Test UPI"), and Cinema Wallet.
   - Simulated bank decline testing to verify failure rollback handling.

6. **Digital Ticket Pass & QR Code**:
   - Digital cinema ticket pass with perforated styling and unique booking reference (`IMV-XXXXXX`).
   - Scannable QR code display.
   - Native print/save integration (`window.print()`).
   - Tiered ticket cancellation policy with instant refund calculation (>2h: 100%, 1-2h: 50%, <1h: 0%).

7. **Operations & Admin Portal**:
   - Real-time KPI metrics: Gross Revenue, Total Bookings, Seat Occupancy Rate (%), and Active Movies.
   - Showtime Scheduler: Schedule new screenings with automatic auditorium seat inventory generation.
   - Searchable booking audit ledger.

8. **In-App Documentation Explorer**:
   - Built-in viewer allowing inspection of all technical architecture and design documents directly within the UI.

---

## 🏗️ Architecture & MVC Structure

The application implements a decoupled Model-View-Controller (MVC) architecture with an Express 4 REST API backend and a React 19 frontend SPA.

```
├── docs/                               # Comprehensive System Documentation
│   ├── technical-architecture.md       # Technical architecture with Mermaid diagram
│   ├── er-diagram.md                   # Complete ER diagram and constraints
│   ├── features.md                     # Implemented vs simulated feature matrix
│   ├── roles-and-responsibilities.md   # Actor definitions and permission matrix
│   ├── user-flow.md                    # Mermaid user flows (booking, payment, admin)
│   ├── mvc-pattern.md                  # MVC layer breakdown & sequence diagram
│   ├── system-requirements.md          # Runtime, hardware, and dependency specs
│   ├── api-documentation.md            # Detailed REST API endpoint contracts
│   └── testing.md                      # Testing guide, test personas, and verification
├── server/
│   ├── db/
│   │   └── database.ts                 # MongoDB-compatible document store & indexes
│   ├── models/
│   │   └── types.ts                    # Core TypeScript domain entities
│   ├── controllers/                    # Express route controllers
│   ├── middleware/                     # JWT authentication, validation, error handler
│   ├── routes/                         # REST API route definitions (/api/v1/*)
│   └── services/                       # Business logic (booking, auth, payment, sync)
├── src/
│   ├── components/                     # React UI components
│   ├── services/
│   │   └── api.ts                      # Client-side API fetch client
│   ├── types.ts                        # Frontend type definitions
│   ├── App.tsx                         # Main SPA container and tab routing
│   ├── main.tsx                        # React application bootstrap
│   └── index.css                       # Global Tailwind CSS imports
├── server.ts                           # Full-stack server entry point (port 3000)
├── package.json                        # Scripts and dependencies
└── tsconfig.json                       # TypeScript compiler options
```

---

## 🚀 Quickstart & Running Locally

### Installation

```bash
# Install dependencies
npm install

# Run full-stack dev server (port 3000)
npm run dev
```

The application will be live at `http://localhost:3000`.

### Type Checking & Building

```bash
# Run TypeScript compilation check
npm run lint

# Build production assets
npm run build
```

---

## 👥 Test Personas & Credentials

| Role | Name | Email | Password | Pre-Seeded Context |
| :--- | :--- | :--- | :--- | :--- |
| **Member** | Sarah Connor | `user@imovies.com` | `user123` | Active confirmed booking `IMV-784920` for Dune: Part Two in New York. |
| **Admin** | Cinema Admin | `admin@imovies.com` | `admin123` | Full access to the Admin Portal, KPI dashboards, and showtime scheduler. |
| **Guest** | Anonymous | N/A | N/A | Can browse movies, hold seats, and complete guest checkout. |

*(Use the **Quick Persona Switch** in the top navigation or login modal to switch between accounts with one click).*

---

## 📚 Documentation Index

All six core documentation sections and supporting specifications are located in `/docs`:
- [Technical Architecture](docs/technical-architecture.md)
- [ER Diagram](docs/er-diagram.md)
- [Features Specification](docs/features.md)
- [Roles & Responsibilities](docs/roles-and-responsibilities.md)
- [User Flow Diagrams](docs/user-flow.md)
- [MVC Pattern & Sequence](docs/mvc-pattern.md)
- [System Requirements](docs/system-requirements.md)
- [REST API Documentation](docs/api-documentation.md)
- [Testing & Verification Guide](docs/testing.md)
