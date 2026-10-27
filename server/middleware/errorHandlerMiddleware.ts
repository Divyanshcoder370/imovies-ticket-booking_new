/**
 * IMovies Central Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[IMovies API Error]', err);

  const statusCode = err.status || err.statusCode || (err.message.includes('not found') ? 404 : 400);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error occurred',
    code: err.code || 'API_ERROR'
  });
};
