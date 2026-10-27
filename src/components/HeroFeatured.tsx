import React, { useState } from 'react';
import { Play, Calendar, Star, Clock, Film } from 'lucide-react';
import { Movie } from '../types';

interface HeroFeaturedProps {
  movie: Movie | null;
  onBookMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ movie, onBookMovie, onOpenTrailer }) => {
  const [backdropFailed, setBackdropFailed] = useState(false);

  if (!movie) return null;

  return (
    <div className="relative w-full h-[440px] sm:h-[480px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      {!backdropFailed ? (
        <img
          src={movie.backdropUrl}
          alt={`${movie.title} cinematic backdrop`}
          referrerPolicy="no-referrer"
          onError={() => setBackdropFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-100"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 flex items-center justify-end pr-12">
          <Film className="w-64 h-64 text-amber-500/5 rotate-12" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />

      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-8">
        <div className="max-w-2xl space-y-3.5">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
            <span className="text-amber-400 font-semibold">{movie.rating}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              {movie.score}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {movie.durationMinutes} min
            </span>
            <span aria-hidden="true">·</span>
            <span>{movie.genres.join(', ')}</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {movie.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 italic mt-1 font-serif">
              "{movie.tagline}"
            </p>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
            {movie.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onBookMovie(movie)}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Tickets
            </button>

            <button
              onClick={() => onOpenTrailer(movie)}
              className="px-4 py-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium text-sm transition flex items-center gap-2 cursor-pointer backdrop-blur"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              Watch Trailer
            </button>

            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {movie.formatAvailable.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-900/80 border border-zinc-700 text-zinc-300"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
