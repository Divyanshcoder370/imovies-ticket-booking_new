import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, Trash2, QrCode, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Booking, User } from '../types';
import { ApiClient } from '../services/api';

interface MyBookingsViewProps {
  user: User | null;
  onOpenAuth: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ user, onOpenAuth }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await ApiClient.getMyBookings();
      setBookings(res.bookings);
    } catch (err: any) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Refund will be calculated according to cinema policy.')) {
      return;
    }

    try {
      const res = await ApiClient.cancelBooking(bookingId, 'Customer cancellation via My Tickets');
      setActionMessage(res.message);
      loadBookings();
      if (selectedTicket?.id === bookingId) {
        setSelectedTicket(res.booking);
      }
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign in to view your tickets</h2>
        <p className="text-xs text-zinc-400">
          Sign in or use the demo account to view your confirmed reservations, scannable passes, and refund history.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Cinema Tickets</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your movie tickets, entry barcodes, and eligible refunds.
          </p>
        </div>
        <button
          onClick={loadBookings}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-xs text-zinc-500">Loading your tickets...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl space-y-3">
          <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No bookings found</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You don't have any booked cinema tickets yet. Browse our movies to reserve your seats!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'confirmed';
            const isCancelled = b.status === 'cancelled' || b.status === 'refunded';

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {b.bookingReference}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        isConfirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {b.movie?.title || 'Movie Experience'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {b.cinema?.name || 'IMovies Cineplex'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {b.showtime?.startTime ? new Date(b.showtime.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '7:00 PM'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-zinc-200 font-semibold">
                      Seats: {b.seats.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  <div className="text-left md:text-right">
                    <p className="text-[11px] text-zinc-500 uppercase font-semibold">Paid Amount</p>
                    <p className="text-base font-black text-white font-mono">
                      ${b.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTicket(b)}
                      className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      View Pass
                    </button>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="p-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/30 transition cursor-pointer"
                        title="Cancel booking"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-sm w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-mono text-xs font-bold text-amber-400">
                {selectedTicket.bookingReference}
              </span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {selectedTicket.movie?.title || 'Movie'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {selectedTicket.cinema?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900 p-3 rounded-xl">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Seats</p>
                <p className="text-amber-400 font-bold">{selectedTicket.seats.join(', ')}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Status</p>
                <p className="text-white capitalize font-semibold">{selectedTicket.status}</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow">
                <QrCode className="w-24 h-24 text-zinc-950" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-mono">Present at auditorium scanner</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
