import React, { useState, useEffect } from 'react';
import { ShieldAlert, DollarSign, Ticket, Users, Film, Plus, Search, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User, Movie, Cinema, Screen } from '../types';
import { ApiClient } from '../services/api';

interface AdminDashboardProps {
  user: User | null;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onOpenAuth }) => {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New showtime form state
  const [showAddShowtime, setShowAddShowtime] = useState(false);
  const [formMovieId, setFormMovieId] = useState('');
  const [formCinemaId, setFormCinemaId] = useState('');
  const [formScreenId, setFormScreenId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [standardPrice, setStandardPrice] = useState(15.0);
  const [premiumPrice, setPremiumPrice] = useState(19.0);
  const [vipPrice, setVipPrice] = useState(25.0);
  const [screensList, setScreensList] = useState<Screen[]>([]);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await ApiClient.getAdminStats();
      setStats(statsRes.stats);

      const bookingsRes = await ApiClient.getAdminBookings({
        search: searchQuery || undefined,
        status: statusFilter || undefined
      });
      setBookings(bookingsRes.bookings);

      const moviesRes = await ApiClient.getMovies();
      setMovies(moviesRes.movies);
      if (moviesRes.movies.length > 0 && !formMovieId) {
        setFormMovieId(moviesRes.movies[0].id);
      }

      const cinemasRes = await ApiClient.getCinemas();
      setCinemas(cinemasRes.cinemas);
      if (cinemasRes.cinemas.length > 0 && !formCinemaId) {
        setFormCinemaId(cinemasRes.cinemas[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  // Update screens when selected cinema changes in form
  useEffect(() => {
    const fetchScreens = async () => {
      if (!formCinemaId) return;
      try {
        const res = await ApiClient.getCinemaScreens(formCinemaId);
        setScreensList(res.screens);
        if (res.screens.length > 0) {
          setFormScreenId(res.screens[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch screens:', err);
      }
    };

    fetchScreens();
  }, [formCinemaId]);

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMovieId || !formCinemaId || !formScreenId || !formDate || !formTime) {
      alert('Please fill out all showtime fields.');
      return;
    }

    try {
      const startTime = new Date(`${formDate}T${formTime}:00`).toISOString();
      await ApiClient.createShowtime({
        movieId: formMovieId,
        cinemaId: formCinemaId,
        screenId: formScreenId,
        startTime,
        priceTiers: {
          standard: Number(standardPrice),
          premium: Number(premiumPrice),
          vip: Number(vipPrice)
        }
      });

      setFormMessage('Showtime created successfully and auditorium seat map generated!');
      setTimeout(() => setFormMessage(null), 4000);
      setShowAddShowtime(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating showtime: ${err.message}`);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-zinc-400">
          Sign in as an administrator (or switch persona to <strong>admin@imovies.com</strong>) to access the operations dashboard, showtime scheduler, and booking ledger.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Cinema Operations Portal</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Admin
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time occupancy metrics, showtime scheduling, and audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddShowtime(!showAddShowtime)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            Schedule Showtime
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {formMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{formMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-[10px] text-zinc-500">{stats.confirmedBookingsCount} settled tickets</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Total Bookings</span>
              <Ticket className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{stats.totalBookings}</p>
            <p className="text-[10px] text-zinc-500">All registered sessions</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Seat Occupancy</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{stats.occupancyRate}%</p>
            <p className="text-[10px] text-zinc-500">Across active screens</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Active Movies</span>
              <Film className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{stats.activeMoviesCount}</p>
            <p className="text-[10px] text-zinc-500">In theatrical rotation</p>
          </div>
        </div>
      )}

      {/* Schedule Showtime Modal / Inline Form */}
      {showAddShowtime && (
        <form
          onSubmit={handleCreateShowtime}
          className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Schedule New Showtime & Auditorium
            </h3>
            <button
              type="button"
              onClick={() => setShowAddShowtime(false)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Movie</label>
              <select
                value={formMovieId}
                onChange={(e) => setFormMovieId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Cinema</label>
              <select
                value={formCinemaId}
                onChange={(e) => setFormCinemaId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              >
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Screen / Auditorium</label>
              <select
                value={formScreenId}
                onChange={(e) => setFormScreenId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              >
                {screensList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.screenType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Date</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Time</label>
              <input
                type="time"
                required
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          {/* Pricing tiers */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Standard Price ($)</label>
              <input
                type="number"
                step="0.5"
                value={standardPrice}
                onChange={(e) => setStandardPrice(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Premium Price ($)</label>
              <input
                type="number"
                step="0.5"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">VIP Price ($)</label>
              <input
                type="number"
                step="0.5"
                value={vipPrice}
                onChange={(e) => setVipPrice(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer"
            >
              Confirm & Generate Seat Inventory
            </button>
          </div>
        </form>
      )}

      {/* Bookings Inspection Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-white text-base">Booking Ledger & Audit</h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="pb-3 font-semibold">Reference</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Movie</th>
                <th className="pb-3 font-semibold">Seats</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3 font-mono font-bold text-amber-400">{b.bookingReference}</td>
                  <td className="py-3 text-zinc-200">
                    <p>{b.customerName}</p>
                    <p className="text-[10px] text-zinc-500">{b.customerEmail || 'Guest'}</p>
                  </td>
                  <td className="py-3 text-zinc-300 truncate max-w-[150px]">{b.movieTitle}</td>
                  <td className="py-3 font-mono text-zinc-300">{b.seats.join(', ')}</td>
                  <td className="py-3 font-mono font-bold text-white">${b.totalAmount.toFixed(2)}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : b.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-500 text-[11px]">
                    {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
