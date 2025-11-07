import express, { Request, Response } from 'express';
import CheckIn from '../models/CheckIn';
import Student from '../models/Student';
import Term from '../models/Term';

const router = express.Router();

// GET check-ins with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, termId, startDate, endDate } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (studentId) query.studentId = studentId;
    if (termId) query.termId = termId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const checkIns = await CheckIn.find(query)
      .sort({ timestamp: -1 })
      .populate('studentId', 'name iso role')
      .lean();

    const checkInsFormatted = checkIns.map((checkIn) => ({
      id: checkIn._id,
      studentId: checkIn.studentId,
      termId: checkIn.termId,
      type: checkIn.type,
      timestamp: checkIn.timestamp,
      isManual: checkIn.isManual,
    }));

    res.json(checkInsFormatted);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({ message: 'Error fetching check-ins', error: (error as Error).message });
  }
});

// POST - Create a new check-in (manual or card swipe)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { studentId, termId, type, timestamp, isManual } = req.body;

    if (!studentId || !termId || !type) {
      return res.status(400).json({ message: 'studentId, termId, and type are required' });
    }

    // Verify student and term exist
    const student = await Student.findById(studentId);
    const term = await Term.findById(termId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    const newCheckIn = new CheckIn({
      studentId,
      termId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isManual: isManual || false,
    });

    await newCheckIn.save();

    res.status(201).json({
      id: newCheckIn._id,
      studentId: newCheckIn.studentId,
      termId: newCheckIn.termId,
      type: newCheckIn.type,
      timestamp: newCheckIn.timestamp,
      isManual: newCheckIn.isManual,
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ message: 'Error creating check-in', error: (error as Error).message });
  }
});

// DELETE - Delete a check-in
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const checkIn = await CheckIn.findByIdAndDelete(req.params.id);

    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    res.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    console.error('Error deleting check-in:', error);
    res.status(500).json({ message: 'Error deleting check-in', error: (error as Error).message });
  }
});

export default router;

