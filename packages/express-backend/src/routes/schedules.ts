import express, { Request, Response } from 'express';
import Schedule from '../models/Schedule.js';
import Student from '../models/Student.js';
import Term from '../models/Term.js';

const router = express.Router();

// GET schedule for a student in a specific term
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { studentId, termId } = req.query;

    if (!studentId || !termId) {
      return res.status(400).json({ message: 'studentId and termId are required' });
    }

    const schedule = await Schedule.findOne({ studentId, termId }).lean();

    if (!schedule) {
      return res.json({
        studentId,
        termId,
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
      });
    }

    res.json({
      id: schedule._id,
      studentId: schedule.studentId,
      termId: schedule.termId,
      availability: schedule.availability,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule', error: (error as Error).message });
  }
});

// POST - Create or update a schedule
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { studentId, termId, availability } = req.body;

    if (!studentId || !termId || !availability) {
      return res.status(400).json({ message: 'studentId, termId, and availability are required' });
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

    // Check if schedule already exists
    let schedule = await Schedule.findOne({ studentId, termId });

    if (schedule) {
      // Update existing schedule
      schedule.availability = availability;
      await schedule.save();
    } else {
      // Create new schedule
      schedule = new Schedule({
        studentId,
        termId,
        availability,
      });
      await schedule.save();
    }

    res.status(201).json({
      id: schedule._id,
      studentId: schedule.studentId,
      termId: schedule.termId,
      availability: schedule.availability,
    });
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    res.status(500).json({ message: 'Error creating/updating schedule', error: (error as Error).message });
  }
});

// DELETE - Delete a schedule
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { studentId, termId } = req.query;

    if (!studentId || !termId) {
      return res.status(400).json({ message: 'studentId and termId are required' });
    }

    const schedule = await Schedule.findOneAndDelete({ studentId, termId });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule', error: (error as Error).message });
  }
});

export default router;

