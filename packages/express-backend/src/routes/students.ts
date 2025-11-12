import express from 'express';
import studentsController from '../controllers/students.controller.js';
import { validateRequired } from '../middleware/validation.js';

const router = express.Router();

router.get('/', (req, res, next) => {
  studentsController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  studentsController.getById(req, res, next);
});

router.post('/', validateRequired(['name', 'cardId', 'role']), (req, res, next) => {
  studentsController.create(req, res, next);
});

router.put('/:id', (req, res, next) => {
  studentsController.update(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  studentsController.delete(req, res, next);
});

export default router;
