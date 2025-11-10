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

    // Separate matched and unmatched (unmatched will be created)
    const matchedStudents = matched.filter(m => m.matched);
    const unmatchedStudents = matched.filter(m => !m.matched);

    res.json({
      success: true,
      summary: {
        totalRows: processedSchedules.length,
        matched: matchedStudents.length,
        willCreate: unmatchedStudents.length,
      },
      matchedStudents,
      studentsToCreate: unmatchedStudents,
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

    // Process all students (matched and unmatched)
    const savedSchedules = [];
    const createdStudents = [];
    const errors = [];

    for (const student of matched) {
      try {
        let studentId = student.studentId;

        // If student doesn't exist, create them
        if (!student.matched) {
          console.log(`Creating new student: ${student.csvName}`);
          
          // Generate a placeholder card ID (can be updated later)
          const placeholderCardId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newStudent = new Student({
            name: student.csvName,
            iso: placeholderCardId,
            role: 'Assistant', // Default role, can be updated later
            status: 'active',
          });

          await newStudent.save();
          studentId = (newStudent._id as any).toString();

          createdStudents.push({
            studentId,
            studentName: student.csvName,
            cardId: placeholderCardId,
          });
        }

        // Normalize availability (already normalized in CSV parser, but double-check)
        const normalizedAvailability = normalizeSchedule(student.availability);

        // Find or create schedule
        let schedule = await Schedule.findOne({ 
          studentId, 
          termId 
        });

        if (schedule) {
          schedule.availability = normalizedAvailability;
          await schedule.save();
        } else {
          schedule = new Schedule({
            studentId,
            termId,
            availability: normalizedAvailability,
          });
          await schedule.save();
        }

        savedSchedules.push({
          studentId,
          studentName: student.studentName,
          wasCreated: !student.matched,
        });
      } catch (error) {
        errors.push({
          studentName: student.studentName,
          error: (error as Error).message,
        });
      }
    }

    const createdCount = createdStudents.length;
    const matchedCount = savedSchedules.length - createdCount;

    res.status(201).json({
      success: true,
      message: `Successfully imported schedules for ${savedSchedules.length} students (${matchedCount} existing, ${createdCount} new)`,
      summary: {
        totalProcessed: processedSchedules.length,
        saved: savedSchedules.length,
        matched: matchedCount,
        created: createdCount,
        errors: errors.length,
      },
      savedSchedules,
      createdStudents,
      errors,
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

