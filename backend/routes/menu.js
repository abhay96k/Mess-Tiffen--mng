import express from 'express';
import { getMenu, updateMenu } from '../controllers/menuController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMenu);
router.put('/:dayIndex', protect, admin, updateMenu);

export default router;
