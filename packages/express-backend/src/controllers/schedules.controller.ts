import { Request, Response, NextFunction } from 'express';
import schedulesService from '../services/schedules.service.js';

export class SchedulesController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, termId } = req.query;
      if (!studentId || !termId) {
        res.status(400).json({ message: 'studentId and termId are required' });
        return;
      }
      const schedule = await schedulesService.getSchedule(
        studentId as string,
        termId as string
      );
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }

  async createOrUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { studentId, termId, availability } = req.body;
      const schedule = await schedulesService.createOrUpdateSchedule({
        studentId,
        termId,
        availability,
      });
      res.status(201).json(schedule);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Student not found' || err.message === 'Term not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId, termId } = req.query;
      if (!studentId || !termId) {
        res.status(400).json({ message: 'studentId and termId are required' });
        return;
      }
      await schedulesService.deleteSchedule(
        studentId as string,
        termId as string
      );
      res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Schedule not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }
}

export default new SchedulesController();

