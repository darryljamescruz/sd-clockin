import { Request, Response, NextFunction } from 'express';
import Term from '../models/Term.js';
import type { Term as TermType, CreateTermDto, UpdateTermDto } from '@sd-clockin/shared';

const parseDateString = (dateString: string): Date => {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateString);
};

const formatTerm = (term: {
  _id: { toString(): string };
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}): TermType => ({
  id: term._id.toString(),
  name: term.name,
  startDate: term.startDate.toISOString().split('T')[0],
  endDate: term.endDate.toISOString().split('T')[0],
  isActive: term.isActive,
});

export class TermsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const terms = await Term.find().sort({ startDate: -1 }).lean();
      const termsFormatted = terms.map(formatTerm);
      res.json(termsFormatted);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const term = await Term.findById(req.params.id).lean();
      if (!term) {
        res.status(404).json({ message: 'Term not found' });
        return;
      }
      res.json(formatTerm(term));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, startDate, endDate, isActive } = req.body as CreateTermDto;

      const start = parseDateString(startDate);
      const end = parseDateString(endDate);

      if (start >= end) {
        res.status(400).json({ message: 'Start date must be before end date' });
        return;
      }

      const year = start.getFullYear();

      // If this term is being set as active, deactivate all other terms
      if (isActive) {
        await Term.updateMany({}, { isActive: false });
      }

      const newTerm = new Term({
        name,
        startDate: start,
        endDate: end,
        year,
        isActive: isActive || false,
      });

      await newTerm.save();
      res.status(201).json(formatTerm(newTerm));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, startDate, endDate, isActive } = req.body as UpdateTermDto;
      const term = await Term.findById(req.params.id);

      if (!term) {
        res.status(404).json({ message: 'Term not found' });
        return;
      }

      if (startDate && endDate) {
        const start = parseDateString(startDate);
        const end = parseDateString(endDate);

        if (start >= end) {
          res.status(400).json({ message: 'Start date must be before end date' });
          return;
        }

        term.startDate = start;
        term.endDate = end;
        term.year = start.getFullYear();
      } else if (startDate) {
        const start = parseDateString(startDate);
        if (start >= term.endDate) {
          res.status(400).json({ message: 'Start date must be before end date' });
          return;
        }
        term.startDate = start;
        term.year = start.getFullYear();
      } else if (endDate) {
        const end = parseDateString(endDate);
        if (term.startDate >= end) {
          res.status(400).json({ message: 'Start date must be before end date' });
          return;
        }
        term.endDate = end;
      }

      if (name) term.name = name;

      // If this term is being set as active, deactivate all other terms
      if (isActive !== undefined) {
        if (isActive) {
          await Term.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
        }
        term.isActive = isActive;
      }

      await term.save();
      res.json(formatTerm(term));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const term = await Term.findByIdAndDelete(req.params.id);
      if (!term) {
        res.status(404).json({ message: 'Term not found' });
        return;
      }
      res.json({ message: 'Term deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new TermsController();

