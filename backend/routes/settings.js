import express from 'express';
import { getPricing, updatePricing } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/pricing', getPricing);
router.put('/pricing', protect, admin, updatePricing);

export default router;
