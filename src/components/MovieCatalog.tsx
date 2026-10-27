import React, { useState } from 'react';
import { Search, Star, Clock, Info, Calendar, Film } from 'lucide-react';
import { Movie } from '../types';

interface MovieCatalogProps {
  movies: Movie[];
  statusFilter: 'now_showing' | 'coming_soon';
  setStatusFilter: (status: 'now_showing' | 'coming_soon') => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
}

export const MovieCatalog: React.FC<MovieCatalogProps> = ({
  movies,
  statusFilter,
  setStatusFilter,
  selectedGenre,
  setSelectedGenre,
  searchQuery,
  setSearchQuery,
  onSelectMovie,
  onOpenDetails
}) => {
  const genres = ['All', 'Sci-Fi', 'Action', 'Drama', 'Adventure', 'Animation', 'Biography', 'Comedy'];
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filtered = movies.filter((m) => {
    const matchesStatus = m.status === statusFilter;
    const matchesGenre = selectedGenre === 'All' || m.genres.includes(selectedGenre);
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cast.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesGenre && matchesSearch;
  });

  const handleImageError = (movieId: string) => {
    setFailedImages((prev) => ({ ...prev, [movieId]: true }));
  };

  return (
    <section className="space-y-6 pt-6">
      {/* Filters and search toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status segmented buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
          <button
            onClick={() => setStatusFilter('now_showing')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'now_showing'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Now Showing
          </button>
          <button
            onClick={() => setStatusFilter('coming_soon')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'coming_soon'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Coming Soon
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search movie title, director, cast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Genre tag filter buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedGenre === g
                ? 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Movies Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-400 text-sm">No movies match your selected criteria.</p>
          <button
            onClick={() => {
              setSelectedGenre('All');
              setSearchQuery('');
            }}
            className="mt-3 px-3 py-1.5 text-xs text-amber-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((movie) => {
            const hasError = failedImages[movie.id];

            return (
              <div
                key={movie.id}
                className="group bg-zinc-900/70 border border-zinc-800/90 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                {/* Poster image container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950">
                  {!hasError ? (
                    <img
                      src={movie.posterUrl}
                      alt={`${movie.title} official movie poster`}
                      referrerPolicy="no-referrer"
                      onError={() => handleImageError(movie.id)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    /* Fallback styled container when image fails or network is blocked */
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-amber-950/30 p-5 flex flex-col justify-between border-b border-zinc-800">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Film className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          IMOVIES
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-base leading-tight font-serif">
                          {movie.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 italic">"{movie.tagline}"</p>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {movie.director} · {movie.releaseDate.split('-')[0]}
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80 pointer-events-none" />

                  {/* Score badge */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur border border-zinc-800 text-xs text-amber-400 font-semibold flex items-center gap-1 z-10">
                    <Star className="w-3 h-3 fill-current" />
                    {movie.score}
                  </div>

                  {/* Format chips */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 z-10">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-zinc-950">
                      {movie.rating}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-700">
                      {movie.formatAvailable[0]}
                    </span>
                  </div>
                </div>

                {/* Card info */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
                      <span>{movie.genres.slice(0, 2).join(' / ')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {movie.durationMinutes}m
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                    <button
                      onClick={() => onSelectMovie(movie)}
                      className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Select Seats
                    </button>
                    <button
                      onClick={() => onOpenDetails(movie)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Movie Details & Trailer"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
