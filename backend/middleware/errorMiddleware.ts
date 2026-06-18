import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: number; // MongoDB duplicate key error code
  errors?: Record<string, { message: string }>;
}

export const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Middleware Error Logger]:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details: any = undefined;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation Failed';
    details = {};
    for (const key of Object.keys(err.errors)) {
      details[key] = err.errors[key].message;
    }
  }

  // Handle Mongoose Cast Error (invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field. Check query parameters.`;
  }

  // Handle MongoDB Duplicate Key (e.g. Unique Email / Seats indexes)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists or details conflict with another entry.';
    details = err.errors || undefined;
  }

  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
