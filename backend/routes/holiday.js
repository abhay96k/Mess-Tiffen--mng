import express from 'express';
import { declareHoliday, getHolidays } from '../controllers/holidayController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/', protect, admin, declareHoliday);

export default router;
