import express from 'express';
import { getAnnouncements, publishAnnouncement } from '../controllers/announcementController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getAnnouncements)
  .post(protect, admin, publishAnnouncement);

export default router;
