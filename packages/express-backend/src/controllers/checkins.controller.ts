import { Request, Response, NextFunction } from 'express';
import checkinsService from '../services/checkins.service.js';
import type { CreateCheckInDto, UpdateCheckInDto, CheckInQueryParams } from '@sd-clockin/shared';

export class CheckInsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: CheckInQueryParams = {
        studentId: req.query.studentId as string | undefined,
        termId: req.query.termId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const checkIns = await checkinsService.getCheckIns(params);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateCheckInDto = {
        studentId: req.body.studentId,
        termId: req.body.termId,
        type: req.body.type,
        timestamp: req.body.timestamp,
        isManual: req.body.isManual || false,
      };
      const checkIn = await checkinsService.createCheckIn(data);
      res.status(201).json(checkIn);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Student not found' || err.message === 'Term not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || id.trim() === '') {
        res.status(400).json({ message: 'Invalid check-in ID provided' });
        return;
      }

      const data: UpdateCheckInDto = {
        timestamp: req.body.timestamp,
        type: req.body.type,
      };
      const checkIn = await checkinsService.updateCheckIn(id, data);
      res.json(checkIn);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Check-in not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await checkinsService.deleteCheckIn(req.params.id);
      res.json({ message: 'Check-in deleted successfully' });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Check-in not found') {
        res.status(404).json({ message: err.message });
        return;
      }
      next(error);
    }
  }
}

export default new CheckInsController();

