import express, { Request, Response } from 'express';
import Term from '../models/Term';

const router = express.Router();

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
    }));

    res.json(termsFormatted);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ message: 'Error fetching terms', error: (error as Error).message });
  }
});

// GET a single term by ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
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
    });
  } catch (error) {
    console.error('Error fetching term:', error);
    res.status(500).json({ message: 'Error fetching term', error: (error as Error).message });
  }
});

// POST - Create a new term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate, isActive } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
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

    res.status(201).json({
      id: newTerm._id,
      name: newTerm.name,
      startDate: newTerm.startDate.toISOString().split('T')[0],
      endDate: newTerm.endDate.toISOString().split('T')[0],
      isActive: newTerm.isActive,
    });
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ message: 'Error creating term', error: (error as Error).message });
  }
});

// PUT - Update a term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate, isActive } = req.body;

    const term = await Term.findById(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }

      term.startDate = start;
      term.endDate = end;
      term.year = start.getFullYear();
    } else if (startDate) {
      const start = new Date(startDate);
      if (start >= term.endDate) {
        return res.status(400).json({ message: 'Start date must be before end date' });
      }
      term.startDate = start;
      term.year = start.getFullYear();
    } else if (endDate) {
      const end = new Date(endDate);
      if (term.startDate >= end) {
        return res.status(400).json({ message: 'Start date must be before end date' });
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

    res.json({
      id: term._id,
      name: term.name,
      startDate: term.startDate.toISOString().split('T')[0],
      endDate: term.endDate.toISOString().split('T')[0],
      isActive: term.isActive,
    });
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ message: 'Error updating term', error: (error as Error).message });
  }
});

// DELETE - Delete a term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
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
});

export default router;

