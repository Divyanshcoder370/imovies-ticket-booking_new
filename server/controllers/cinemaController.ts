/**
 * IMovies Cinema & Screen Controller
 */

import { Request, Response } from 'express';
import { db } from '../db/database.js';

export class CinemaController {
  public static getAllCinemas = (req: Request, res: Response): void => {
    try {
      const { city } = req.query;
      let cinemas = db.cinemas.find();

      if (city && typeof city === 'string') {
        cinemas = cinemas.filter(c => c.city.toLowerCase() === city.toLowerCase());
      }

      res.status(200).json({ success: true, count: cinemas.length, cinemas });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getCinemaById = (req: Request, res: Response): void => {
    try {
      const cinema = db.cinemas.findById(req.params.id);
      if (!cinema) {
        res.status(404).json({ success: false, error: 'Cinema not found' });
        return;
      }
      const screens = db.screens.find(s => s.cinemaId === cinema.id);
      res.status(200).json({ success: true, cinema, screens });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getScreens = (req: Request, res: Response): void => {
    try {
      const screens = db.screens.find(s => s.cinemaId === req.params.cinemaId);
      res.status(200).json({ success: true, screens });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public static getConcessions = (_req: Request, res: Response): void => {
    try {
      const concessions = db.concessions.find();
      res.status(200).json({ success: true, concessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
