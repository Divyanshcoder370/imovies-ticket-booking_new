/**
 * IMovies Request Body Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required field(s): ${missing.join(', ')}`
      });
      return;
    }

    next();
  };
};
