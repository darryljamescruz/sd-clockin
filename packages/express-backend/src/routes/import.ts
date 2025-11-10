import express, { Request, Response } from 'express';
import Student from '../models/Student.js';
import Schedule from '../models/Schedule.js';
import Term from '../models/Term.js';
import { parseTeamsCSV, matchStudentsByName } from '../utils/csvImporter.js';
import { normalizeSchedule } from '../utils/scheduleParser.js';

const router = express.Router();

// POST - Preview CSV import (doesn't save, just shows what would be imported)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/preview', async (req: Request, res: Response): Promise<any> => {
  try {
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ message: 'csvContent is required' });
    }

    // Parse the CSV
    const processedSchedules = parseTeamsCSV(csvContent);

    // Get all existing students
    const existingStudents = await Student.find({}).lean();
    const studentsSimple = existingStudents.map(s => ({
      id: s._id.toString(),
      name: s.name,
    }));

    // Match by name
    const matched = matchStudentsByName(processedSchedules, studentsSimple);

    // Separate matched and unmatched
    const matchedStudents = matched.filter(m => m.matched);
    const unmatchedStudents = matched.filter(m => !m.matched);

    res.json({
      success: true,
      summary: {
        totalRows: processedSchedules.length,
        matched: matchedStudents.length,
        unmatched: unmatchedStudents.length,
      },
      matchedStudents,
      unmatchedStudents,
    });
  } catch (error) {
    console.error('Error previewing CSV import:', error);
    res.status(500).json({ 
      message: 'Error previewing CSV import', 
      error: (error as Error).message 
    });
  }
});

// POST - Import CSV and save schedules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/schedules', async (req: Request, res: Response): Promise<any> => {
  try {
    const { csvContent, termId } = req.body;

    if (!csvContent || !termId) {
      return res.status(400).json({ message: 'csvContent and termId are required' });
    }

    // Verify term exists
    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    // Parse the CSV
    const processedSchedules = parseTeamsCSV(csvContent);

    // Get all existing students
    const existingStudents = await Student.find({}).lean();
    const studentsSimple = existingStudents.map(s => ({
      id: s._id.toString(),
      name: s.name,
    }));

    // Match by name
    const matched = matchStudentsByName(processedSchedules, studentsSimple);

    // Filter only matched students
    const matchedStudents = matched.filter(m => m.matched);

    if (matchedStudents.length === 0) {
      return res.status(400).json({ 
        message: 'No students could be matched. Please ensure student emails are registered in the system.' 
      });
    }

    // Save schedules for matched students
    const savedSchedules = [];
    const errors = [];

    for (const matchedStudent of matchedStudents) {
      try {
        // Normalize availability (already normalized in CSV parser, but double-check)
        const normalizedAvailability = normalizeSchedule(matchedStudent.availability);

        // Find or create schedule
        let schedule = await Schedule.findOne({ 
          studentId: matchedStudent.studentId, 
          termId 
        });

        if (schedule) {
          schedule.availability = normalizedAvailability;
          await schedule.save();
        } else {
          schedule = new Schedule({
            studentId: matchedStudent.studentId,
            termId,
            availability: normalizedAvailability,
          });
          await schedule.save();
        }

        savedSchedules.push({
          studentId: matchedStudent.studentId,
          studentName: matchedStudent.studentName,
        });
      } catch (error) {
        errors.push({
          studentName: matchedStudent.studentName,
          error: (error as Error).message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported schedules for ${savedSchedules.length} students`,
      summary: {
        totalProcessed: processedSchedules.length,
        saved: savedSchedules.length,
        errors: errors.length,
        unmatched: matched.filter(m => !m.matched).length,
      },
      savedSchedules,
      errors,
      unmatchedStudents: matched.filter(m => !m.matched),
    });
  } catch (error) {
    console.error('Error importing schedules:', error);
    res.status(500).json({ 
      message: 'Error importing schedules', 
      error: (error as Error).message 
    });
  }
});

export default router;

