import express from 'express';
import checkinsController from '../controllers/checkins.controller.js';
import { validateRequired } from '../middleware/validation.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  checkinsController.getAll(req, res, next);
});

router.post(
  '/',
  validateRequired(['studentId', 'termId', 'type']),
  (req, res, next) => {
    checkinsController.create(req, res, next);
  }
);

router.put('/:id', (req, res, next) => {
  checkinsController.update(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  checkinsController.delete(req, res, next);
});

export default router;
