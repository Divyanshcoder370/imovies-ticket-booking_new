import React from 'react';
import { X, Star, Clock, Calendar, Film } from 'lucide-react';
import { Movie } from '../types';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBook: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({ movie, onClose, onBook }) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video / Backdrop Header */}
        <div className="relative aspect-video w-full bg-zinc-900">
          {movie.trailerUrl.includes('youtube.com') ? (
            <iframe
              src={`${movie.trailerUrl}?autoplay=0&rel=0`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-none"
            />
          ) : (
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{movie.title}</h2>
              <p className="text-xs text-zinc-400 italic font-serif">"{movie.tagline}"</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.score} / 10
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
                {movie.rating}
              </span>
              <span className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                {movie.durationMinutes}m
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">{movie.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
            <div>
              <p className="text-zinc-500 font-medium uppercase text-[10px]">Director</p>
              <p className="text-zinc-200 font-medium mt-0.5">{movie.director}</p>
            </div>
            <div>
              <p className="text-zinc-500 font-medium uppercase text-[10px]">Release Date</p>
              <p className="text-zinc-200 font-medium mt-0.5">{movie.releaseDate}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-zinc-500 font-medium uppercase text-[10px]">Starring</p>
              <p className="text-zinc-200 mt-0.5">{movie.cast.join(', ')}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-zinc-500 font-medium uppercase text-[10px]">Available Formats</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {movie.formatAvailable.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBook(movie);
              }}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Calendar className="w-4 h-4" />
              Book Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
