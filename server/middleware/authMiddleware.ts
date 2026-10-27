/**
 * IMovies Authentication & Authorization Middleware
 * Verifies JWT tokens, populates req.user, and enforces role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService.js';
import { UserRole } from '../models/types.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
    return;
  }

  req.user = payload;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`
      });
      return;
    }

    next();
  };
};
