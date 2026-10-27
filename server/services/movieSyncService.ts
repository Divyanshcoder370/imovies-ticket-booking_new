/**
 * IMovies External Movie-Data Integration Service
 * Provides adapter for external film databases (e.g. TMDB / IMDb API metadata sync)
 * and syncs movie details, posters, trailers, and ratings.
 */

import { db } from '../db/database.js';
import { Movie } from '../models/types.js';

export interface ExternalMovieData {
  tmdbId?: number;
  title: string;
  tagline: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  durationMinutes: number;
  rating: string;
  score: number;
  releaseDate: string;
  language: string;
  director: string;
  cast: string[];
  trailerUrl: string;
  status: 'now_showing' | 'coming_soon';
  formatAvailable: ('IMAX 3D' | 'Dolby Atmos' | '4K Laser' | 'Standard 2D')[];
}

export class MovieSyncService {
  /**
   * Fetches latest movies from external movie provider or falls back to local curated index
   */
  public static async syncExternalMovie(data: ExternalMovieData): Promise<Movie> {
    const existing = db.movies.findOne(
      m => m.title.toLowerCase() === data.title.toLowerCase()
    );

    if (existing) {
      const updated = db.movies.updateOne(existing.id, {
        description: data.description,
        score: data.score,
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl,
        status: data.status,
        formatAvailable: data.formatAvailable
      })!;
      return updated;
    }

    const newMovie: Movie = {
      id: `mov_${Date.now()}`,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      posterUrl: data.posterUrl,
      backdropUrl: data.backdropUrl,
      genres: data.genres,
      durationMinutes: data.durationMinutes,
      rating: data.rating,
      score: data.score,
      releaseDate: data.releaseDate,
      language: data.language,
      director: data.director,
      cast: data.cast,
      trailerUrl: data.trailerUrl,
      status: data.status,
      formatAvailable: data.formatAvailable,
      createdAt: new Date().toISOString()
    };

    return db.movies.insertOne(newMovie);
  }

  /**
   * Search external film database simulated provider
   */
  public static searchExternalCatalog(query: string): Partial<ExternalMovieData>[] {
    const all = db.movies.find();
    return all.filter(m =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.genres.some(g => g.toLowerCase().includes(query.toLowerCase())) ||
      m.director.toLowerCase().includes(query.toLowerCase())
    );
  }
}
