import express from 'express';
import { getTodayAttendance, toggleMealAttendance, getAttendanceSummary, updateStudentAttendance, applySkipMealAttendance, getStudentAttendanceHistory } from '../controllers/attendanceController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/today', protect, getTodayAttendance);
router.post('/toggle', protect, toggleMealAttendance);
router.get('/history', protect, getStudentAttendanceHistory);
router.get('/summary', protect, admin, getAttendanceSummary);
router.put('/update', protect, admin, updateStudentAttendance);
router.post('/request-skip', protect, applySkipMealAttendance);

export default router;
