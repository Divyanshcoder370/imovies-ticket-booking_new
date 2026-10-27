import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroFeatured } from './components/HeroFeatured';
import { MovieCatalog } from './components/MovieCatalog';
import { MovieModal } from './components/MovieModal';
import { BookingFlow } from './components/BookingFlow';
import { MyBookingsView } from './components/MyBookingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { DocumentationViewer } from './components/DocumentationViewer';
import { AuthModal } from './components/AuthModal';
import { Movie, Cinema, User } from './types';
import { ApiClient } from './services/api';
import { MapPin, Phone, Film, Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'movies' | 'cinemas' | 'bookings' | 'admin' | 'docs'>('movies');
  const [selectedCity, setSelectedCity] = useState<string>('New York');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Movie catalog state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [statusFilter, setStatusFilter] = useState<'now_showing' | 'coming_soon'>('now_showing');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<Movie | null>(null);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<Movie | null>(null);

  // Check existing session
  useEffect(() => {
    const checkUser = async () => {
      const token = ApiClient.getToken();
      if (token) {
        try {
          const res = await ApiClient.getMe();
          setUser(res.user);
        } catch {
          ApiClient.logout();
        }
      }
    };
    checkUser();
  }, []);

  // Fetch initial movies and cinemas
  useEffect(() => {
    const loadData = async () => {
      try {
        const mRes = await ApiClient.getMovies();
        setMovies(mRes.movies);

        const cRes = await ApiClient.getCinemas(selectedCity);
        setCinemas(cRes.cinemas);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      }
    };
    loadData();
  }, [selectedCity]);

  const featuredMovie = movies.find((m) => m.id === 'mov_dune2') || movies[0] || null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedMovieForBooking(null);
          setCurrentTab(tab);
        }}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        user={user}
        setUser={setUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedMovieForBooking ? (
          <BookingFlow
            movie={selectedMovieForBooking}
            selectedCity={selectedCity}
            onBack={() => setSelectedMovieForBooking(null)}
            onBookingComplete={() => {
              // Can optionally transition to my bookings
            }}
          />
        ) : (
          <>
            {currentTab === 'movies' && (
              <div className="space-y-8">
                {/* Hero Featured Blockbuster */}
                <HeroFeatured
                  movie={featuredMovie}
                  onBookMovie={(m) => setSelectedMovieForBooking(m)}
                  onOpenTrailer={(m) => setSelectedMovieForDetails(m)}
                />

                {/* Catalog & Filter Grid */}
                <MovieCatalog
                  movies={movies}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  selectedGenre={selectedGenre}
                  setSelectedGenre={setSelectedGenre}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSelectMovie={(m) => setSelectedMovieForBooking(m)}
                  onOpenDetails={(m) => setSelectedMovieForDetails(m)}
                />
              </div>
            )}

            {currentTab === 'cinemas' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Cinemas in {selectedCity}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Premium auditoriums featuring IMAX Laser, Dolby Atmos acoustic soundstages, and VIP lounges.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cinemas.map((cinema) => (
                    <div
                      key={cinema.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition space-y-4"
                    >
                      <div className="relative h-48 bg-zinc-950">
                        <img
                          src={cinema.imageUrl}
                          alt={cinema.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <span className="text-lg font-bold text-white">{cinema.name}</span>
                          <p className="text-xs text-zinc-300">{cinema.location}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{cinema.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{cinema.phone}</span>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                            Auditorium Amenities
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {cinema.amenities.map((a) => (
                              <span
                                key={a}
                                className="px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (movies.length > 0) {
                              setSelectedMovieForBooking(movies[0]);
                            }
                          }}
                          className="w-full mt-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
                        >
                          View Showtimes at this Cinema
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTab === 'bookings' && (
              <MyBookingsView user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard user={user} onOpenAuth={() => setIsAuthModalOpen(true)} />
            )}

            {currentTab === 'docs' && <DocumentationViewer />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-zinc-300">IMovies Ticketing Platform</span>
            <span>·</span>
            <span>Full-Stack Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => setCurrentTab('docs')} className="hover:text-amber-400 transition cursor-pointer">
              Technical Architecture
            </button>
            <button onClick={() => setCurrentTab('docs')} className="hover:text-amber-400 transition cursor-pointer">
              ER Diagrams
            </button>
            <button onClick={() => setCurrentTab('docs')} className="hover:text-amber-400 transition cursor-pointer">
              MVC Specification
            </button>
          </div>
        </div>
      </footer>

      {/* Movie Details / Trailer Modal */}
      <MovieModal
        movie={selectedMovieForDetails}
        onClose={() => setSelectedMovieForDetails(null)}
        onBook={(m) => {
          setSelectedMovieForBooking(m);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
