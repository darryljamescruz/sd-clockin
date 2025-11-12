import express from 'express';
import importController from '../controllers/import.controller.js';
import { validateRequired } from '../middleware/validation.js';

const router = express.Router();

router.post(
  '/preview',
  validateRequired(['csvContent']),
  (req, res, next) => {
    importController.previewCSV(req, res, next);
  }
);

router.post(
  '/schedules',
  validateRequired(['csvContent', 'termId']),
  (req, res, next) => {
    importController.importSchedules(req, res, next);
  }
);

export default router;
