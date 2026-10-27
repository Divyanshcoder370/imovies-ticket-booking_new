/**
 * IMovies Movie Controller
 * Manages movie discovery, details, search, and admin CRUD
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';
import { Movie } from '../models/types.js';

export class MovieController {
  public static getAllMovies = (req: Request, res: Response): void => {
    try {
      const { status, genre, search } = req.query;
      let movies = db.movies.find();

      if (status && typeof status === 'string') {
        movies = movies.filter(m => m.status === status);
      }

      if (genre && typeof genre === 'string') {
        movies = movies.filter(m => m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        movies = movies.filter(
          m =>
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.director.toLowerCase().includes(q) ||
            m.cast.some(c => c.toLowerCase().includes(q))
        );
      }

      res.status(200).json({ success: true, count: movies.length, movies });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getMovieById = (req: Request, res: Response): void => {
    try {
      const movie = db.movies.findById(req.params.id);
      if (!movie) {
        res.status(404).json({ success: false, error: 'Movie not found' });
        return;
      }
      res.status(200).json({ success: true, movie });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static createMovie = (req: Request, res: Response): void => {
    try {
      const movieData: Movie = {
        ...req.body,
        id: `mov_${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      const created = db.movies.insertOne(movieData);
      res.status(201).json({ success: true, movie: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public static updateMovie = (req: Request, res: Response): void => {
    try {
      const updated = db.movies.updateOne(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Movie not found' });
        return;
      }
      res.status(200).json({ success: true, movie: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public static deleteMovie = (req: Request, res: Response): void => {
    try {
      const deleted = db.movies.deleteOne(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Movie not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Movie deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
