import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Download,
  Trash2,
  Tag,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { Movie, Cinema, Showtime, SeatReservation, ConcessionItem, Booking } from '../types';
import { ApiClient } from '../services/api';

interface BookingFlowProps {
  movie: Movie;
  selectedCity: string;
  onBack: () => void;
  onBookingComplete?: (booking: Booking) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  movie,
  selectedCity,
  onBack,
  onBookingComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Showtime Selection state
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);

  // Step 2: Seat Map state
  const [seats, setSeats] = useState<SeatReservation[]>([]);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState<number>(600); // 10 mins

  // Step 3: Concessions state
  const [concessionsCatalog, setConcessionsCatalog] = useState<ConcessionItem[]>([]);
  const [concessionsQuantities, setConcessionsQuantities] = useState<Record<string, number>>({});

  // Step 4: Checkout & Payment state
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [upiVpa, setUpiVpa] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Step 5: Confirmed Booking state
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  // Generate 5 calendar dates starting from today
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  // Load Cinemas and Showtimes
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const cinRes = await ApiClient.getCinemas(selectedCity);
        setCinemas(cinRes.cinemas);
        if (cinRes.cinemas.length > 0) {
          setSelectedCinemaId(cinRes.cinemas[0].id);
        }

        const stRes = await ApiClient.getShowtimes({
          movieId: movie.id,
          date: dates[selectedDateIndex].dateString
        });
        setShowtimes(stRes.showtimes);

        const conRes = await ApiClient.getConcessions();
        setConcessionsCatalog(conRes.concessions);
      } catch (err: any) {
        console.error('Failed to load initial booking data:', err);
      }
    };

    loadInitial();
  }, [movie.id, selectedCity]);

  // Update showtimes when date or cinema changes
  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        const dateStr = dates[selectedDateIndex]?.dateString;
        const res = await ApiClient.getShowtimes({
          movieId: movie.id,
          cinemaId: selectedCinemaId || undefined,
          date: dateStr
        });
        setShowtimes(res.showtimes);
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      }
    };

    fetchShowtimes();
  }, [selectedDateIndex, selectedCinemaId, movie.id]);

  // 10-Minute Hold Countdown Timer Effect
  useEffect(() => {
    if (!holdExpiresAt || step < 2 || step > 4) return;

    const interval = setInterval(() => {
      const remainingMs = new Date(holdExpiresAt).getTime() - Date.now();
      const seconds = Math.max(0, Math.floor(remainingMs / 1000));
      setHoldSecondsRemaining(seconds);

      if (seconds <= 0) {
        clearInterval(interval);
        setHoldExpiresAt(null);
        alert('Your 10-minute seat reservation hold has expired. Please reselect your seats.');
        setSelectedSeatNumbers([]);
        setStep(2);
        loadSeatMap(selectedShowtime!.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt, step, selectedShowtime]);

  const loadSeatMap = async (showtimeId: string) => {
    try {
      const res = await ApiClient.getSeatMap(showtimeId);
      setSeats(res.seats);
    } catch (err: any) {
      console.error('Failed to load seat map:', err);
    }
  };

  const handleSelectShowtime = async (st: Showtime) => {
    setSelectedShowtime(st);
    setSelectedSeatNumbers([]);
    await loadSeatMap(st.id);
    setStep(2);
  };

  const handleSeatClick = (seat: SeatReservation) => {
    if (seat.status === 'booked' || (seat.status === 'locked' && !selectedSeatNumbers.includes(seat.seatNumber))) {
      return;
    }

    if (selectedSeatNumbers.includes(seat.seatNumber)) {
      setSelectedSeatNumbers(selectedSeatNumbers.filter((n) => n !== seat.seatNumber));
    } else {
      if (selectedSeatNumbers.length >= 8) {
        alert('Maximum 8 tickets per booking');
        return;
      }
      setSelectedSeatNumbers([...selectedSeatNumbers, seat.seatNumber]);
    }
  };

  const handleProceedToConcessions = async () => {
    if (selectedSeatNumbers.length === 0 || !selectedShowtime) return;

    try {
      // Hold seats via server lock
      const lockRes = await ApiClient.holdSeats(selectedShowtime.id, selectedSeatNumbers);
      setHoldExpiresAt(lockRes.expiresAt);
      setStep(3);
    } catch (err: any) {
      alert(`Could not reserve seats: ${err.message}`);
      loadSeatMap(selectedShowtime.id);
    }
  };

  const handleProceedToCheckout = () => {
    setPaymentError(null);
    setStep(4);
  };

  // Quick fill test card credentials
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardHolder('Sarah Connor');
    setCardExpiry('12/28');
    setCardCvv('982');
    setSimulateFailure(false);
  };

  // Quick fill test UPI credentials
  const handleFillTestUpi = () => {
    setUpiVpa('member@okhdfcbank');
    setSimulateFailure(false);
  };

  // Calculate pricing breakdown
  const selectedSeatsInfo = selectedSeatNumbers.map((num) => {
    const seat = seats.find((s) => s.seatNumber === num);
    const tier = seat?.tier || 'standard';
    const price = seat?.price || selectedShowtime?.priceTiers[tier] || 15.0;
    return { num, tier, price };
  });

  const ticketsSubtotal = selectedSeatsInfo.reduce((sum, s) => sum + s.price, 0);

  const concessionsSelected = Object.entries(concessionsQuantities)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => {
      const item = concessionsCatalog.find((c) => c.id === id);
      return {
        id,
        name: item?.name || '',
        price: item?.price || 0,
        quantity: q,
        subtotal: (item?.price || 0) * q
      };
    });

  const concessionsSubtotal = concessionsSelected.reduce((sum, c) => sum + c.subtotal, 0);
  const convenienceFee = selectedSeatNumbers.length * 1.75;
  const subtotalBeforeDiscounts = ticketsSubtotal + concessionsSubtotal;
  const discountAmount = discountApplied ? Math.round(subtotalBeforeDiscounts * 0.1 * 100) / 100 : 0;
  const taxableBase = Math.max(0, subtotalBeforeDiscounts - discountAmount + convenienceFee);
  const taxAmount = Math.round(taxableBase * 0.08875 * 100) / 100;
  const grandTotal = Math.round((taxableBase + taxAmount) * 100) / 100;

  // Process checkout and simulated payment
  const handleCompletePayment = async () => {
    if (!selectedShowtime) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Create booking in pending state
      const concessionsPayload = Object.entries(concessionsQuantities)
        .filter(([_, q]) => q > 0)
        .map(([id, quantity]) => ({ id, quantity }));

      const checkoutRes = await ApiClient.checkout({
        showtimeId: selectedShowtime.id,
        seatNumbers: selectedSeatNumbers,
        concessions: concessionsPayload,
        discountCode: discountApplied ? 'IMOVIES10' : undefined
      });

      const pendingBooking = checkoutRes.booking;

      // 2. Process simulated payment
      const paymentRes = await ApiClient.processPayment({
        bookingId: pendingBooking.id,
        amount: grandTotal,
        method: paymentMethod,
        cardDetails:
          paymentMethod === 'card'
            ? {
                cardNumber,
                cardHolder,
                expiry: cardExpiry,
                cvv: cardCvv
              }
            : undefined,
        upiDetails:
          paymentMethod === 'upi'
            ? {
                vpa: upiVpa
              }
            : undefined,
        simulateFailure
      });

      // 3. Complete and show ticket pass
      const confirmed = paymentRes.booking;
      setConfirmedBooking(confirmed);
      setStep(5);
      if (onBookingComplete) {
        onBookingComplete(confirmed);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle in-flow cancellation
  const handleCancelBooking = async () => {
    if (!confirmedBooking) return;
    try {
      const res = await ApiClient.cancelBooking(confirmedBooking.id, 'User cancelled from ticket view');
      setConfirmedBooking(res.booking);
      setCancelMessage(`Booking cancelled. Refund of $${res.refundAmount} (${res.refundPercentage}%) issued.`);
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Movies
        </button>

        {/* Multi-step progress indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className={step >= 1 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
            1. Showtime
          </span>
          <span className="text-zinc-700">/</span>
          <span className={step >= 2 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
            2. Seats
          </span>
          <span className="text-zinc-700">/</span>
          <span className={step >= 3 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
            3. Snacks
          </span>
          <span className="text-zinc-700">/</span>
          <span className={step >= 4 ? 'text-amber-400 font-semibold' : 'text-zinc-600'}>
            4. Checkout
          </span>
          <span className="text-zinc-700">/</span>
          <span className={step === 5 ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
            5. Ticket
          </span>
        </div>
      </div>

      {/* 10-Minute Hold Warning Banner (Active during Seats/Snacks/Payment) */}
      {holdExpiresAt && step >= 2 && step <= 4 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Seats held for checkout. Complete your reservation before the timer expires.
            </span>
          </div>
          <span className="font-mono font-bold text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-amber-500/30">
            {formatTimer(holdSecondsRemaining)}
          </span>
        </div>
      )}

      {/* ================= STEP 1: SHOWTIME SELECTION ================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">Select Date & Showtime</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {movie.title} · {movie.durationMinutes} mins · {movie.rating}
              </p>
            </div>

            {/* Cinema location filter */}
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedCinemaId}
                onChange={(e) => setSelectedCinemaId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-md focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5-Day Date Selector */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {dates.map((d, index) => (
              <button
                key={d.dateString}
                onClick={() => setSelectedDateIndex(index)}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  selectedDateIndex === index
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{d.dayName}</span>
                <span className="text-lg font-black">{d.dayNumber}</span>
                <span className="text-[10px] opacity-80">{d.month}</span>
              </button>
            ))}
          </div>

          {/* Showtimes List */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Available Showtimes ({showtimes.length})
            </h3>

            {showtimes.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No showtimes scheduled for this date and cinema. Please select another day.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {showtimes.map((st) => {
                  const time = new Date(st.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSelectShowtime(st)}
                      className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 text-left transition group cursor-pointer space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                          {time}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {st.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {st.screenName || 'Auditorium 1'} · {st.cinemaName}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        From ${st.priceTiers.standard.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= STEP 2: SEAT SELECTION MAP ================= */}
      {step === 2 && selectedShowtime && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">Choose Your Seats</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {movie.title} · {new Date(selectedShowtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {selectedShowtime.format}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Change Showtime
            </button>
          </div>

          {/* Seat Map Stage */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-8 flex flex-col items-center">
            {/* Curved Screen Visualization */}
            <div className="w-full max-w-lg flex flex-col items-center">
              <div className="w-full h-3 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full opacity-60 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] tracking-widest uppercase font-semibold text-zinc-500 mt-2">
                All Eyes This Way · Cinema Screen
              </span>
            </div>

            {/* Interactive Seat Grid */}
            <div className="space-y-2.5 max-w-full overflow-x-auto pb-4">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((rowLetter) => {
                const rowSeats = seats.filter((s) => s.row === rowLetter);
                if (rowSeats.length === 0) return null;

                return (
                  <div key={rowLetter} className="flex items-center gap-2 justify-center">
                    <span className="w-4 text-xs font-mono text-zinc-500 font-bold text-center">
                      {rowLetter}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rowSeats.map((seat) => {
                        const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
                        const isBooked = seat.status === 'booked';
                        const isLocked = seat.status === 'locked' && !isSelected;

                        let seatBg = 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300';
                        if (isBooked) seatBg = 'bg-zinc-900/40 text-zinc-700 cursor-not-allowed';
                        else if (isLocked) seatBg = 'bg-purple-950/40 text-purple-600 border border-purple-800/40 cursor-not-allowed';
                        else if (isSelected) seatBg = 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20';

                        return (
                          <button
                            key={seat.id}
                            disabled={isBooked || isLocked}
                            onClick={() => handleSeatClick(seat)}
                            title={`${seat.seatNumber} (${seat.tier.toUpperCase()} - $${seat.price.toFixed(2)})`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-md rounded-b text-[10px] flex items-center justify-center transition-all cursor-pointer ${seatBg}`}
                          >
                            {seat.col}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-4 text-xs font-mono text-zinc-500 font-bold text-center">
                      {rowLetter}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Seat Map Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-zinc-200 font-medium">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800" />
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-950/60 border border-purple-800" />
                <span>Held (In Cart)</span>
              </div>
            </div>

            {/* Tier Price Reference */}
            <div className="flex items-center gap-4 text-xs bg-zinc-900/60 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-300">
              <span>Standard: ${selectedShowtime.priceTiers.standard.toFixed(2)}</span>
              <span>·</span>
              <span>Premium: ${selectedShowtime.priceTiers.premium.toFixed(2)}</span>
              <span>·</span>
              <span className="text-amber-400">VIP: ${selectedShowtime.priceTiers.vip.toFixed(2)}</span>
            </div>
          </div>

          {/* Seat summary & Next step */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <p className="text-xs text-zinc-400">Selected Seats ({selectedSeatNumbers.length})</p>
              <p className="text-sm font-semibold text-white">
                {selectedSeatNumbers.length > 0 ? selectedSeatNumbers.join(', ') : 'None selected'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-zinc-400">Subtotal</p>
                <p className="text-lg font-black text-amber-400 font-mono">
                  ${ticketsSubtotal.toFixed(2)}
                </p>
              </div>

              <button
                disabled={selectedSeatNumbers.length === 0}
                onClick={handleProceedToConcessions}
                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs transition shadow cursor-pointer"
              >
                Continue to Snacks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CONCESSIONS / SNACKS ================= */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Cinema Concessions & Snacks</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Add fresh popcorn, gourmet snacks and drinks to pick up at the counter.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Back to Seats
            </button>
          </div>

          {/* Concessions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {concessionsCatalog.map((item) => {
              const qty = concessionsQuantities[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-100 text-sm">{item.name}</h4>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-500">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setConcessionsQuantities({
                            ...concessionsQuantities,
                            [item.id]: Math.max(0, qty - 1)
                          })
                        }
                        className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center cursor-pointer transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold font-mono text-white">
                        {qty}
                      </span>
                      <button
                        onClick={() =>
                          setConcessionsQuantities({
                            ...concessionsQuantities,
                            [item.id]: qty + 1
                          })
                        }
                        className="w-7 h-7 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center cursor-pointer transition font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom action */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <p className="text-xs text-zinc-400">Snacks Subtotal</p>
              <p className="text-sm font-bold text-white font-mono">
                ${concessionsSubtotal.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleProceedToCheckout}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Skip Snacks
              </button>
              <button
                onClick={handleProceedToCheckout}
                className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: CHECKOUT & PAYMENT ================= */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Secure Checkout & Payment</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Complete simulated payment to confirm your booking and issue digital ticket passes.
              </p>
            </div>

            {paymentError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Credit / Debit Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'upi'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-xs">UPI Instant</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'wallet'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs">Cinema Wallet</span>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'card' && (
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      Card Information (Simulated Gateway)
                    </span>
                    <button
                      onClick={handleFillTestCard}
                      className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded cursor-pointer transition"
                    >
                      Use Test Card
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Sarah Connor"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-zinc-400 block mb-1">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-zinc-400 block mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Form */}
              {paymentMethod === 'upi' && (
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">
                      UPI Virtual Payment Address (VPA)
                    </span>
                    <button
                      onClick={handleFillTestUpi}
                      className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded cursor-pointer transition"
                    >
                      Use Test UPI
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">UPI ID</label>
                    <input
                      type="text"
                      placeholder="username@bank"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Wallet Info */}
              {paymentMethod === 'wallet' && (
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <p className="font-semibold text-zinc-100">IMovies Stored Balance</p>
                  <p className="text-zinc-400">
                    Your current cinema loyalty wallet balance is <strong>$250.00</strong>. Total will be debited instantly on confirmation.
                  </p>
                </div>
              )}

              {/* Simulate Failure Checkbox for testing resilience */}
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  id="simFail"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="simFail" className="cursor-pointer">
                  Simulate Bank Decline (Test error rollback handling)
                </label>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Order Summary Breakdown */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-zinc-800 pb-3">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Tickets ({selectedSeatNumbers.length}x)</span>
                  <span className="font-mono">${ticketsSubtotal.toFixed(2)}</span>
                </div>

                {concessionsSelected.map((c) => (
                  <div key={c.id} className="flex justify-between text-zinc-400 text-[11px]">
                    <span>
                      {c.name} ({c.quantity}x)
                    </span>
                    <span className="font-mono">${c.subtotal.toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Convenience Fee ($1.75/ea)</span>
                  <span className="font-mono">${convenienceFee.toFixed(2)}</span>
                </div>

                {discountApplied && (
                  <div className="flex justify-between text-emerald-400 text-[11px]">
                    <span>Coupon Discount (10%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Tax & Municipal Fees (8.875%)</span>
                  <span className="font-mono">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between text-white font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-amber-400 text-base font-mono font-black">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Coupon input */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Coupon (try IMOVIES10)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase placeholder-zinc-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (discountCode.trim().toUpperCase() === 'IMOVIES10') {
                        setDiscountApplied(true);
                      } else {
                        alert('Invalid coupon code. Try IMOVIES10');
                      }
                    }}
                    className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg cursor-pointer transition font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <button
                disabled={isProcessingPayment}
                onClick={handleCompletePayment}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Pay ${grandTotal.toFixed(2)} & Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 5: DIGITAL TICKET CONFIRMATION ================= */}
      {step === 5 && confirmedBooking && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
              <Check className="w-3.5 h-3.5" />
              Booking Confirmed & Settled
            </div>
            <h2 className="text-3xl font-black text-white">Your Cinema Pass is Ready!</h2>
            <p className="text-xs text-zinc-400">
              Present this pass at the auditorium entrance or kiosk for barcode scan.
            </p>
          </div>

          {cancelMessage && (
            <div className="p-3 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-300 text-xs text-center">
              {cancelMessage}
            </div>
          )}

          {/* Ticket Pass Container */}
          <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Movie Backdrop banner */}
            <div className="relative h-36 bg-zinc-950 overflow-hidden">
              <img
                src={movie.backdropUrl}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur text-[10px] text-amber-400 font-bold border border-zinc-800">
                {confirmedBooking.bookingReference}
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-black text-white">{movie.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {selectedShowtime?.cinemaName} · {selectedShowtime?.format}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">Date</p>
                  <p className="text-zinc-200 font-medium mt-0.5">
                    {new Date(selectedShowtime?.startTime || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">Time</p>
                  <p className="text-zinc-200 font-medium mt-0.5">
                    {new Date(selectedShowtime?.startTime || '').toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">Seats</p>
                  <p className="text-amber-400 font-bold text-sm mt-0.5">
                    {confirmedBooking.seats.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-semibold">Total Paid</p>
                  <p className="text-zinc-200 font-bold text-sm mt-0.5">
                    ${confirmedBooking.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Perforated divider visual */}
              <div className="relative py-2 flex items-center justify-between">
                <div className="w-4 h-8 bg-zinc-950 rounded-r-full -ml-6" />
                <div className="flex-1 border-t border-dashed border-zinc-700 mx-2" />
                <div className="w-4 h-8 bg-zinc-950 rounded-l-full -mr-6" />
              </div>

              {/* Scannable Barcode / QR Section */}
              <div className="text-center space-y-2 pt-1">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow">
                  <div className="w-full h-full border-2 border-dashed border-zinc-400 flex flex-col items-center justify-center text-zinc-900">
                    <QrCode className="w-16 h-16 text-zinc-950" />
                    <span className="text-[8px] font-mono font-bold mt-1">SCAN AT DOOR</span>
                  </div>
                </div>
                <p className="font-mono text-xs text-zinc-400 tracking-wider">
                  {confirmedBooking.bookingReference}
                </p>
              </div>
            </div>

            {/* Ticket Actions */}
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Print / Save Pass
              </button>

              {confirmedBooking.status === 'confirmed' && (
                <button
                  onClick={handleCancelBooking}
                  className="px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Cancel booking according to refund policy"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Ticket
                </button>
              )}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onBack}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
