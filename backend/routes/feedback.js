import express from 'express';
import { submitFeedback, getFeedbacks } from '../controllers/feedbackController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, submitFeedback)
  .get(protect, admin, getFeedbacks);

export default router;
