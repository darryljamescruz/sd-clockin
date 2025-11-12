import express from 'express';
import termsController from '../controllers/terms.controller.js';
import { validateRequired } from '../middleware/validation.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  termsController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  termsController.getById(req, res, next);
});

router.post(
  '/',
  validateRequired(['name', 'startDate', 'endDate']),
  (req, res, next) => {
    termsController.create(req, res, next);
  }
);

router.put('/:id', (req, res, next) => {
  termsController.update(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  termsController.delete(req, res, next);
});

export default router;
