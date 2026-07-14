import express from 'express';
import { getStudents, addStudent, updateStudent, deleteStudent, payStudentBill } from '../controllers/studentController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getStudents)
  .post(protect, admin, addStudent);

router.route('/:id')
  .put(protect, admin, updateStudent)
  .delete(protect, admin, deleteStudent);

router.put('/:id/pay', protect, payStudentBill);

export default router;
