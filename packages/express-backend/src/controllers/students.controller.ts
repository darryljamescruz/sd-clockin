import { Request, Response, NextFunction } from 'express';
import studentsService from '../services/students.service.js';

export class StudentsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { termId } = req.query;
      const students = await studentsService.getAllStudents(
        termId as string | undefined
      );
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await studentsService.getStudentById(req.params.id);
      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, cardId, role } = req.body;
      const student = await studentsService.createStudent({ name, cardId, role });
      res.status(201).json(student);
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('already exists')) {
        res.status(409).json({ message: err.message });
        return;
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, cardId, role } = req.body;
      const student = await studentsService.updateStudent(req.params.id, {
        name,
        cardId,
        role,
      });
      res.json(student);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Student not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      if (err.message.includes('already exists')) {
        res.status(409).json({ message: err.message });
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await studentsService.deleteStudent(req.params.id);
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Student not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }
}

export default new StudentsController();

