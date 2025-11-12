import express, { Request, Response, RequestHandler } from 'express';
import Term from '../models/Term.js';

const router = express.Router();

// Helper function to format date ranges
const formatDaysOff = (daysOff: any[]): any[] => {
  if (!daysOff || !Array.isArray(daysOff)) return [];
  return daysOff.map((range) => ({
    startDate: range.startDate.toISOString().split('T')[0],
    endDate: range.endDate.toISOString().split('T')[0],
  }));
};

// GET all terms
router.get('/', async (req: Request, res: Response) => {
  try {
    const terms = await Term.find().sort({ startDate: -1 }).lean();

    const termsFormatted = terms.map((term) => ({
      id: term._id,
      name: term.name,
      startDate: term.startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: term.endDate.toISOString().split('T')[0],
      isActive: term.isActive,
      daysOff: formatDaysOff(term.daysOff),
    }));

    res.json(termsFormatted);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ message: 'Error fetching terms', error: (error as Error).message });
  }
});

// GET a single term by ID
router.get('/:id', (async (req: Request, res: Response) => {
  try {
    const term = await Term.findById(req.params.id).lean();

    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    res.json({
      id: term._id,
      name: term.name,
      startDate: term.startDate.toISOString().split('T')[0],
      endDate: term.endDate.toISOString().split('T')[0],
      isActive: term.isActive,
      daysOff: formatDaysOff(term.daysOff),
    });
  } catch (error) {
    console.error('Error fetching term:', error);
    res.status(500).json({ message: 'Error fetching term', error: (error as Error).message });
  }
}) as RequestHandler);

// Helper function to parse date string without timezone issues
const parseDateString = (dateString: string): Date => {
  // If dateString is in YYYY-MM-DD format, parse it as local date
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  // Fallback to standard parsing
  return new Date(dateString);
};

// POST - Create a new term
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, isActive, daysOff } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }

    const start = parseDateString(startDate);
    const end = parseDateString(endDate);

    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    const year = start.getFullYear();

    // Parse and validate days off
    let parsedDaysOff: any[] = [];
    if (daysOff && Array.isArray(daysOff)) {
      parsedDaysOff = daysOff.map((range: any) => {
        const rangeStart = parseDateString(range.startDate);
        const rangeEnd = parseDateString(range.endDate);
        if (rangeStart > rangeEnd) {
          throw new Error('Day off start date must be before or equal to end date');
        }
        // Validate that days off are within term dates
        if (rangeStart < start || rangeEnd > end) {
          throw new Error('Days off must be within the term start and end dates');
        }
        return {
          startDate: rangeStart,
          endDate: rangeEnd,
        };
      });
    }

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
      daysOff: parsedDaysOff,
    });

    await newTerm.save();

    res.status(201).json({
      id: newTerm._id,
      name: newTerm.name,
      startDate: newTerm.startDate.toISOString().split('T')[0],
      endDate: newTerm.endDate.toISOString().split('T')[0],
      isActive: newTerm.isActive,
      daysOff: formatDaysOff(newTerm.daysOff),
    });
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ message: 'Error creating term', error: (error as Error).message });
  }
}) as RequestHandler);

// PUT - Update a term
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate, isActive, daysOff } = req.body;

    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    if (startDate && endDate) {
      const start = parseDateString(startDate);
      const end = parseDateString(endDate);

      if (start >= end) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }

      term.startDate = start;
      term.endDate = end;
      term.year = start.getFullYear();
    } else if (startDate) {
      const start = parseDateString(startDate);
      if (start >= term.endDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      term.startDate = start;
      term.year = start.getFullYear();
    } else if (endDate) {
      const end = parseDateString(endDate);
      if (term.startDate >= end) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      term.endDate = end;
    }

    if (name) term.name = name;

    // Update days off if provided
    if (daysOff !== undefined) {
      if (Array.isArray(daysOff)) {
        const parsedDaysOff = daysOff.map((range: any) => {
          const rangeStart = parseDateString(range.startDate);
          const rangeEnd = parseDateString(range.endDate);
          if (rangeStart > rangeEnd) {
            throw new Error('Day off start date must be before or equal to end date');
          }
          // Validate that days off are within term dates
          const termStart = term.startDate;
          const termEnd = term.endDate;
          if (rangeStart < termStart || rangeEnd > termEnd) {
            throw new Error('Days off must be within the term start and end dates');
          }
          return {
            startDate: rangeStart,
            endDate: rangeEnd,
          };
        });
        term.daysOff = parsedDaysOff;
      } else {
        return res.status(400).json({ message: 'daysOff must be an array' });
      }
    }

    // If this term is being set as active, deactivate all other terms
    if (isActive !== undefined) {
      if (isActive) {
        await Term.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
      }
      term.isActive = isActive;
    }

    await term.save();

    res.json({
      id: term._id,
      name: term.name,
      startDate: term.startDate.toISOString().split('T')[0],
      endDate: term.endDate.toISOString().split('T')[0],
      isActive: term.isActive,
      daysOff: formatDaysOff(term.daysOff),
    });
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ message: 'Error updating term', error: (error as Error).message });
  }
}) as RequestHandler);

// DELETE - Delete a term
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const term = await Term.findByIdAndDelete(req.params.id);

    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    res.json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Error deleting term:', error);
    res.status(500).json({ message: 'Error deleting term', error: (error as Error).message });
  }
}) as RequestHandler);

export default router;

