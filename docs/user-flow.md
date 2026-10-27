# User Flow Diagrams

## 1. Movie Discovery Flow

This flow illustrates how visitors search, filter, and inspect movie details and trailers.

```mermaid
graph TD
    Start([User Visits IMovies]) --> ViewCatalog[Browse Movie Catalog]
    ViewCatalog --> ActionChoice{User Action}

    ActionChoice -->|Filter Status| ToggleStatus[Toggle Now Showing / Coming Soon]
    ActionChoice -->|Filter Genre| SelectGenre[Select Genre Tag e.g. Sci-Fi, Action]
    ActionChoice -->|Search Input| TypeQuery[Type Movie Title, Cast, or Director]
    ActionChoice -->|Change City| PickCity[Change City: NY, LA, Chicago, London]
    ActionChoice -->|Trailer Click| OpenTrailer[Open Trailer Preview Modal]
    ActionChoice -->|Select Seats| StartBooking[Trigger Showtime / Booking Flow]

    ToggleStatus --> UpdateGrid[Filtered Movie Grid Displayed]
    SelectGenre --> UpdateGrid
    TypeQuery --> UpdateGrid
    PickCity --> UpdateCinemas[Update Cinemas and Venues]
    OpenTrailer --> WatchVideo[Watch YouTube Trailer & Read Synopsis]
    WatchVideo -->|Click Book Tickets| StartBooking
    UpdateGrid --> ActionChoice
```

---

## 2. Authentication Flow (Login & Register)

```mermaid
graph TD
    User([User]) --> ClickSignIn[Clicks 'Sign In' or 'Demo User']
    ClickSignIn --> AuthModal[Auth Modal Opens]
    AuthModal --> Choice{Select Authentication Method}

    Choice -->|Quick Demo Persona| SelectPersona[Click 'Sarah Connor' or 'Cinema Admin']
    Choice -->|Login Form| EnterCredentials[Enter Email & Password]
    Choice -->|Register Form| EnterRegData[Enter Name, Email, Password, Phone]

    SelectPersona --> SubmitAuth[POST /api/v1/auth/login]
    EnterCredentials --> SubmitAuth
    EnterRegData --> SubmitReg[POST /api/v1/auth/register]

    SubmitAuth --> ServerCheck{Valid Credentials?}
    SubmitReg --> ServerCheck

    ServerCheck -->|No| ShowError[Display Error Message: e.g. Invalid credentials]
    ShowError --> AuthModal

    ServerCheck -->|Yes| IssueToken[Generate JWT Token & User Object]
    IssueToken --> StoreToken[Store Token in localStorage]
    StoreToken --> UpdateUI[Update Navbar with User Avatar & Role Badge]
```

---

## 3. Seat Selection & Reservation Flow (10-Minute Hold)

```mermaid
graph TD
    SelectMovie[User Selects Movie] --> ChooseDate[Select 1 of 5 Calendar Dates]
    ChooseDate --> ChooseCinema[Filter by Cinema Location]
    ChooseCinema --> PickShowtime[Select Showtime Slot e.g. 6:30 PM IMAX 3D]
    PickShowtime --> FetchSeats[GET /api/v1/showtimes/:id/seats]
    FetchSeats --> RenderSeatMap[Render Curved Auditorium Screen & Grid]

    RenderSeatMap --> ClickSeat[User Clicks Seat e.g. D5, D6]
    ClickSeat --> ValidateSeat{Is Seat Booked or Held by Other?}

    ValidateSeat -->|Yes| DisableSeat[Seat Click Disabled / Unresponsive]
    ValidateSeat -->|No| ToggleSelection[Toggle Seat in Selection Array]

    ToggleSelection --> UpdateSubtotal[Recalculate Ticket Subtotal]
    UpdateSubtotal --> ContinueBtn[Click 'Continue to Snacks']

    ContinueBtn --> HoldRequest[POST /api/v1/bookings/hold]
    HoldRequest --> ServerHoldCheck{Atomic Conflict Check}

    ServerHoldCheck -->|Conflict 409| SeatTakenError[Error: Seat held by another customer]
    SeatTakenError --> FetchSeats

    ServerHoldCheck -->|Success 200| LockSeats[Seats Locked in DB with expiresAt]
    LockSeats --> StartTimer[Start 10-Minute Countdown Banner in UI]
    StartTimer --> ConcessionsStep[Proceed to Snacks & Concessions Step]
```

---

## 4. Booking, Snacks, and Payment Checkout Flow

```mermaid
graph TD
    ConcessionsStep[Snacks & Concessions Step] --> AddSnacks[Select Popcorn, Nachos, Sodas]
    AddSnacks --> ProceedCheckout[Click 'Proceed to Checkout']
    ProceedCheckout --> OrderBreakdown[Review Order: Tickets + Snacks + Fees + Tax]

    OrderBreakdown --> CouponOption{Apply Discount Code?}
    CouponOption -->|Yes| EnterCoupon[Enter 'IMOVIES10' for 10% Off]
    CouponOption -->|No| SelectPaymentMethod
    EnterCoupon --> SelectPaymentMethod[Choose Payment Method]

    SelectPaymentMethod -->|Credit Card| CardForm[Enter Card or Click 'Use Test Card']
    SelectPaymentMethod -->|UPI| UpiForm[Enter VPA or Click 'Use Test UPI']
    SelectPaymentMethod -->|Wallet| WalletOption[Select Cinema Stored Wallet]

    CardForm --> ClickPay[Click 'Pay $XX.XX & Confirm']
    UpiForm --> ClickPay
    WalletOption --> ClickPay

    ClickPay --> CreateBookingReq[POST /api/v1/bookings/checkout]
    CreateBookingReq --> PendingBooking[Booking Created with status: 'pending']
    PendingBooking --> ProcessPaymentReq[POST /api/v1/payments/process]

    ProcessPaymentReq --> GatewayCheck{Payment Verification}

    GatewayCheck -->|Simulated Failure / Declined| PaymentFail[HTTP 400: Card Declined / Insufficient Funds]
    PaymentFail --> ShowPaymentError[Display Error Banner in UI]

    GatewayCheck -->|Success 200| PaymentSuccess[Payment Completed & Settled]
    PaymentSuccess --> ConfirmBooking[Seats Marked 'booked', Booking 'confirmed']
    ConfirmBooking --> RenderTicketPass[Display Digital Ticket Pass with QR Code]
```

---

## 5. Booking Confirmation & Cancellation Flow

```mermaid
graph TD
    RenderTicket[Customer Views Ticket Pass] --> Options{Customer Action}

    Options -->|Print / Save| WindowPrint[Trigger window.print Dialog]
    Options -->|Return to Movies| Catalog[Browse Other Movies]
    Options -->|Cancel Ticket| RequestCancel[Click 'Cancel Ticket']

    RequestCancel --> ConfirmPrompt{Confirm Cancellation?}
    ConfirmPrompt -->|No| RenderTicket
    ConfirmPrompt -->|Yes| CancelAPI[POST /api/v1/bookings/:id/cancel]

    CancelAPI --> CheckShowtimeTime{Hours Remaining Until Showtime?}

    CheckShowtimeTime -->|>= 2 Hours| FullRefund[100% Refund Issued]
    CheckShowtimeTime -->|1 to 2 Hours| PartialRefund[50% Refund Issued]
    CheckShowtimeTime -->|< 1 Hour| NoRefund[0% Refund - Forfeited]

    FullRefund --> ReleaseSeats[Seats Released Back to 'available']
    PartialRefund --> ReleaseSeats
    NoRefund --> ReleaseSeats

    ReleaseSeats --> UpdateBookingStatus[Booking status set to 'refunded' or 'cancelled']
    UpdateBookingStatus --> DisplayRefundBanner[Display Cancellation & Refund Confirmation]
```

---

## 6. Administrator Operations Flow

```mermaid
graph TD
    AdminLogin[Admin Signs In as admin@imovies.com] --> AdminTab[Navigate to 'Admin' Tab]
    AdminTab --> AdminDashboard[Load Operations Portal]

    AdminDashboard --> AdminActions{Choose Admin Function}

    AdminActions -->|View Metrics| ReviewKPIs[Inspect Gross Revenue, Total Bookings, Occupancy %]
    AdminActions -->|Schedule Showtime| OpenScheduler[Click 'Schedule Showtime']
    AdminActions -->|Audit Bookings| SearchLedger[Search Booking Ledger by Reference or Status]

    OpenScheduler --> FillScheduleForm[Select Movie, Cinema, Screen, Date, Time, Prices]
    FillScheduleForm --> SubmitShowtime[POST /api/v1/admin/showtimes]
    SubmitShowtime --> ProvisionSeats[Showtime Created & Full Auditorium Seat Map Provisioned]
    ProvisionSeats --> RefreshDashboard[Metrics and Showtimes Refreshed]

    SearchLedger --> ViewAuditRow[Inspect Customer Name, Seats, Paid Amount, and Status]
```
