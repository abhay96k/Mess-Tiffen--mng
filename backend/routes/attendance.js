import express from 'express';
import { getTodayAttendance, toggleMealAttendance, getAttendanceSummary } from '../controllers/attendanceController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/today', protect, getTodayAttendance);
router.post('/toggle', protect, toggleMealAttendance);
router.get('/summary', protect, admin, getAttendanceSummary);

export default router;
