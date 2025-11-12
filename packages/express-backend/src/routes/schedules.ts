import express from 'express';
import schedulesController from '../controllers/schedules.controller.js';
import { validateRequired, validateQueryParams } from '../middleware/validation.js';

const router = express.Router();

router.get('/', validateQueryParams(['studentId', 'termId']), (req, res, next) => {
  schedulesController.get(req, res, next);
});

router.post(
  '/',
  validateRequired(['studentId', 'termId', 'availability']),
  (req, res, next) => {
    schedulesController.createOrUpdate(req, res, next);
  }
);

router.delete('/', validateQueryParams(['studentId', 'termId']), (req, res, next) => {
  schedulesController.delete(req, res, next);
});

export default router;
