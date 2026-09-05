import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const summary = errors.map((e) => e.message).join('. ') || 'Validation failed';
      sendError(res, summary, 'VALIDATION_ERROR', 400, errors);
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const summary = errors.map((e) => e.message).join('. ') || 'Query validation failed';
      sendError(res, summary, 'VALIDATION_ERROR', 400, errors);
      return;
    }
    req.query = result.data as Record<string, string>;
    next();
  };
};
