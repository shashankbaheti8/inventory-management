import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.filter(p => !['body', 'query', 'params'].includes(String(p)));
          const fieldName = path.map(String).join(' ');
          const formatted = fieldName.replace(/([A-Z])/g, ' $1').trim();
          const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
          return `${capitalized || 'Input'}: ${e.message}`;
        });
        next(ApiError.badRequest(messages.join(' • ')));
      } else {
        next(error);
      }
    }
  };
};
