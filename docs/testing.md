# Testing & Verification Guide

## 1. Test Personas & Credentials

The IMovies platform contains pre-seeded test accounts for role validation and end-to-end testing:

| Persona | Role | Email | Password | Pre-Seeded Data |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Connor** | `user` (Customer) | `user@imovies.com` | `user123` | Pre-existing confirmed booking `IMV-784920` for Dune: Part Two in New York. |
| **Cinema Admin** | `admin` (Operator) | `admin@imovies.com` | `admin123` | Full access to the Admin Portal, KPI dashboards, and showtime scheduler. |
| **Guest User** | `guest` (Anonymous) | N/A | N/A | Can explore movies, initiate 10-minute seat holds, and complete checkout. |

---

## 2. Test Verification Scenarios

### Scenario A: Concurrency Protection & Double-Booking Prevention
1. Open two browser sessions (or one normal tab and one incognito window).
2. In Session 1, select a showtime for "Dune: Part Two" and choose seats `D5` and `D6`.
3. Click "Continue to Snacks". The server will place an atomic hold lock on `D5` and `D6` expiring in 10 minutes (`expiresAt`).
4. In Session 2, navigate to the same showtime.
5. **Expected Result**: Seats `D5` and `D6` appear purple with a hold indicator and are disabled. If Session 2 attempts a manual `POST /api/v1/bookings/hold`, the backend returns `HTTP 409 Conflict: "Seat D5 is currently on hold by another customer"`.

### Scenario B: 10-Minute Hold Expiry & Automatic Seat Release
1. Select seats in a showtime and proceed to checkout.
2. Observe the live countdown timer banner: `09:59 ... 09:58`.
3. Allow the timer to elapse (or invoke the background reap job `db.cleanupExpiredSeatLocks()`).
4. **Expected Result**: The frontend notifies the customer that the reservation has expired and returns to the seat map. The backend releases the locked seats back to `available`.

### Scenario C: Payment Method Validation & Declined Card Rollback
1. Select seats and snacks, then proceed to the Checkout screen.
2. Click **"Use Test Card"** to populate valid card credentials (`4242 4242 4242 4242`).
3. Check the **"Simulate Bank Decline"** checkbox (or input a card ending in `0002`).
4. Click **"Pay & Confirm"**.
5. **Expected Result**: The payment gateway mock rejects the transaction with `HTTP 400 Bad Request: "Transaction declined by bank authorization network: Insufficient funds or card restriction."`.
6. The booking remains in `pending` and does NOT confirm or issue tickets.
7. Uncheck the decline box and click **"Pay & Confirm"**. The transaction settles with `HTTP 200 OK` and renders the confirmed digital pass.

### Scenario D: Coupon Discount Verification
1. In checkout, verify the itemized ticket subtotal.
2. In the coupon box, enter `IMOVIES10` and click "Apply".
3. **Expected Result**: A 10% discount line item (`-$X.XX`) is applied to the subtotal before taxes and convenience fees.

### Scenario E: Ticket Cancellation & Tiered Refund Matrix
1. Navigate to **"My Tickets"** while logged in as Sarah Connor.
2. Select confirmed booking `IMV-784920` and click **"Cancel Ticket"**.
3. **Verification**:
   - If the screening start time is $> 2$ hours in the future: receives **100% refund**.
   - If between $1$ and $2$ hours: receives **50% refund**.
   - If $< 1$ hour: receives **0% refund** and status changes to `cancelled`.
4. The booked seats are released and immediately become available for other customers to reserve.

### Scenario F: Role-Based Authorization Guards
1. As a regular user or guest, attempt to send a request to `GET /api/v1/admin/dashboard-stats` without admin credentials.
2. **Expected Result**:
   - Unauthenticated: `HTTP 401 Unauthorized`.
   - Regular user: `HTTP 403 Forbidden: "Forbidden: Access requires one of [admin] roles. Your role is 'user'."`.
3. Sign in as `admin@imovies.com`. Access to `/api/v1/admin/*` succeeds with `HTTP 200 OK`.

---

## 3. Automated Type & Build Verification

The codebase is checked for static type soundness and build compilation via:

```bash
# TypeScript strict compile check
npm run lint

# Production asset compilation
npm run build
```
Both commands execute with zero type errors and zero compilation warnings.
