import { Request, Response, NextFunction } from 'express';
import Student from '../models/Student.js';
import Schedule from '../models/Schedule.js';
import Term from '../models/Term.js';
import { parseTeamsCSV, matchStudentsByName } from '../utils/csvImporter.js';
import { normalizeSchedule } from '../utils/scheduleParser.js';

export class ImportController {
  async previewCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csvContent } = req.body;

      if (!csvContent) {
        res.status(400).json({ message: 'csvContent is required' });
        return;
      }

      const processedSchedules = parseTeamsCSV(csvContent);
      const existingStudents = await Student.find({}).lean();
      const studentsSimple = existingStudents.map((s) => ({
        id: s._id.toString(),
        name: s.name,
      }));

      const matched = matchStudentsByName(processedSchedules, studentsSimple);
      const matchedStudents = matched.filter((m) => m.matched);
      const unmatchedStudents = matched.filter((m) => !m.matched);

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
      next(error);
    }
  }

  async importSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { csvContent, termId } = req.body;

      if (!csvContent || !termId) {
        res.status(400).json({ message: 'csvContent and termId are required' });
        return;
      }

      const term = await Term.findById(termId);
      if (!term) {
        res.status(404).json({ message: 'Term not found' });
        return;
      }

      const processedSchedules = parseTeamsCSV(csvContent);
      const existingStudents = await Student.find({}).lean();
      const studentsSimple = existingStudents.map((s) => ({
        id: s._id.toString(),
        name: s.name,
      }));

      const matched = matchStudentsByName(processedSchedules, studentsSimple);
      const savedSchedules = [];
      const createdStudents = [];
      const errors = [];

      for (const student of matched) {
        try {
          let studentId = student.studentId;

          if (!student.matched) {
            const placeholderCardId = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newStudent = new Student({
              name: student.csvName,
              iso: placeholderCardId,
              role: 'Assistant',
              status: 'active',
            });

            await newStudent.save();
            studentId = newStudent._id.toString();

            createdStudents.push({
              studentId,
              studentName: student.csvName,
              cardId: placeholderCardId,
            });
          }

          const normalizedAvailability = normalizeSchedule(student.availability);
          let schedule = await Schedule.findOne({ studentId, termId });

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
      next(error);
    }
  }
}

export default new ImportController();

