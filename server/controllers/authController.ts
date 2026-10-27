/**
 * IMovies Authentication Controller
 */

import { Response } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { db } from '../db/database.js';

export class AuthController {
  public static register = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { name, email, password, phone } = req.body;
      const result = AuthService.register({ name, email, password, phone });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public static login = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const { email, password } = req.body;
      const result = AuthService.login(email, password);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err.message });
    }
  };

  public static getMe = (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = db.users.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User account not found' });
      return;
    }

    const { passwordHash, ...safeUser } = user;
    res.status(200).json({ success: true, user: safeUser });
  };
}
