import { Request, Response, NextFunction } from 'express';

export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field] && req.body[field] !== false) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    next();
  };
};

export const validateQueryParams = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.query[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        message: `Missing required query parameters: ${missingFields.join(', ')}`,
      });
      return;
    }

    next();
  };
};

