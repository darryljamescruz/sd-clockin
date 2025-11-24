import express, { Request, Response, RequestHandler } from 'express';
import CheckIn from '../models/CheckIn.js';
import Student from '../models/Student.js';
import Term from '../models/Term.js';
import Shift from '../models/Shift.js';
import { getPSTDateAsUTC } from '../utils/timezone.js';
import cache, { CacheKeys } from '../utils/cache.js';

const router = express.Router();

// GET check-ins with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, termId, startDate, endDate } = req.query;

    interface MongoQuery {
      studentId?: string;
      termId?: string;
      timestamp?: {
        $gte?: Date;
        $lte?: Date;
      };
    }

    const query: MongoQuery = {};

    if (studentId) query.studentId = studentId as string;
    if (termId) query.termId = termId as string;

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
    res
      .status(500)
      .json({
        message: 'Error fetching check-ins',
        error: (error as Error).message,
      });
  }
});

// Helper function to check if a date is a day off
const isDayOff = (date: Date, term: any): boolean => {
  if (
    !term.daysOff ||
    !Array.isArray(term.daysOff) ||
    term.daysOff.length === 0
  ) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return term.daysOff.some((range: any) => {
    const rangeStart = new Date(range.startDate);
    const rangeEnd = new Date(range.endDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    return checkDate >= rangeStart && checkDate <= rangeEnd;
  });
};

// POST - Create a new check-in (manual or card swipe)
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { studentId, termId, type, timestamp, isManual } = req.body;

    if (!studentId || !termId || !type) {
      return res
        .status(400)
        .json({ message: 'studentId, termId, and type are required' });
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

    // Check if the check-in date is a day off
    const checkInDate = timestamp ? new Date(timestamp) : new Date();
    if (isDayOff(checkInDate, term)) {
      return res.status(400).json({
        message:
          'Cannot check in on a day off. This date is marked as a day off for this term.',
      });
    }

    const newCheckIn = new CheckIn({
      studentId,
      termId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      isManual: isManual || false,
    });

    const savedCheckIn = await newCheckIn.save();

    // Update or create shift
    // Use PST date to ensure consistency with how shifts are queried in students route
    const savedCheckInTimestamp = new Date(savedCheckIn.timestamp);
    const shiftDate = getPSTDateAsUTC(savedCheckInTimestamp);

    console.log(
      'Creating/finding shift for date:',
      shiftDate,
      'from check-in:',
      savedCheckIn.timestamp
    );

    let shift = await Shift.findOne({
      studentId: savedCheckIn.studentId,
      termId: savedCheckIn.termId,
      date: shiftDate,
    });

    if (!shift) {
      shift = new Shift({
        studentId: savedCheckIn.studentId,
        termId: savedCheckIn.termId,
        date: shiftDate,
        // Don't set scheduledStart/scheduledEnd for manual entries - they're not scheduled
        status: type === 'in' ? 'started' : 'scheduled',
        source: 'manual',
      });
    }

    if (type === 'in') {
      shift.status = 'started';
      shift.actualStart = savedCheckIn.timestamp;
    } else if (type === 'out') {
      shift.status = 'completed';
      shift.actualEnd = savedCheckIn.timestamp;
    }

    await shift.save();

    // Invalidate caches after check-in/out
    const dateKey = shiftDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    await Promise.all([
      cache.invalidateStudent(savedCheckIn.studentId.toString(), savedCheckIn.termId.toString()),
      cache.invalidateTodayShifts(savedCheckIn.termId.toString(), dateKey),
      cache.delete(CacheKeys.STUDENT_CHECKINS(savedCheckIn.studentId.toString(), savedCheckIn.termId.toString())),
    ]);

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
    res
      .status(500)
      .json({
        message: 'Error creating check-in',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// PUT - Update a check-in
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const { timestamp, type } = req.body;
    const { id } = req.params;

    // Validate ID format
    if (!id || id.trim() === '') {
      return res.status(400).json({ message: 'Invalid check-in ID provided' });
    }

    const checkIn = await CheckIn.findById(id);

    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    // Get the term to check for days off
    const term = await Term.findById(checkIn.termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    // Update timestamp if provided
    if (timestamp) {
      const newTimestamp = new Date(timestamp);
      // Check if the new timestamp is on a day off
      if (isDayOff(newTimestamp, term)) {
        return res.status(400).json({
          message:
            'Cannot update check-in to a day off. This date is marked as a day off for this term.',
        });
      }
      checkIn.timestamp = newTimestamp;
    }

    // Update type if provided
    if (type) {
      checkIn.type = type;
    }

    // Mark as manual since it's being edited
    checkIn.isManual = true;

    const updatedCheckIn = await checkIn.save();

    // Update shift if it exists
    // Use PST date to ensure consistency with how shifts are queried in students route
    const checkInDate = new Date(updatedCheckIn.timestamp);
    const shiftDate = getPSTDateAsUTC(checkInDate);

    const shift = await Shift.findOne({
      studentId: updatedCheckIn.studentId,
      termId: updatedCheckIn.termId,
      date: shiftDate,
    });

    if (shift) {
      if (updatedCheckIn.type === 'in') {
        shift.actualStart = updatedCheckIn.timestamp;
      } else if (updatedCheckIn.type === 'out') {
        shift.actualEnd = updatedCheckIn.timestamp;
        shift.status = 'completed';
      }
      await shift.save();
    }

    // Invalidate caches after check-in update
    const dateKey = shiftDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    await Promise.all([
      cache.invalidateStudent(updatedCheckIn.studentId.toString(), updatedCheckIn.termId.toString()),
      cache.invalidateTodayShifts(updatedCheckIn.termId.toString(), dateKey),
      cache.delete(CacheKeys.STUDENT_CHECKINS(updatedCheckIn.studentId.toString(), updatedCheckIn.termId.toString())),
    ]);

    res.json({
      id: updatedCheckIn._id,
      studentId: updatedCheckIn.studentId,
      termId: updatedCheckIn.termId,
      type: updatedCheckIn.type,
      timestamp: updatedCheckIn.timestamp,
      isManual: updatedCheckIn.isManual,
    });
  } catch (error) {
    console.error('Error updating check-in:', error);
    res
      .status(500)
      .json({
        message: 'Error updating check-in',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// DELETE - Delete a check-in
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);

    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    // Store data before deletion for cache invalidation
    const studentId = checkIn.studentId.toString();
    const termId = checkIn.termId.toString();
    const checkInDate = new Date(checkIn.timestamp);
    const shiftDate = getPSTDateAsUTC(checkInDate);
    const dateKey = shiftDate.toISOString().split('T')[0];

    await CheckIn.findByIdAndDelete(req.params.id);

    // Invalidate caches after check-in deletion
    await Promise.all([
      cache.invalidateStudent(studentId, termId),
      cache.invalidateTodayShifts(termId, dateKey),
      cache.delete(CacheKeys.STUDENT_CHECKINS(studentId, termId)),
    ]);

    res.json({ message: 'Check-in deleted successfully' });
  } catch (error) {
    console.error('Error deleting check-in:', error);
    res
      .status(500)
      .json({
        message: 'Error deleting check-in',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

export default router;
