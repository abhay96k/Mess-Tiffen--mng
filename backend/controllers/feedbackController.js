import { Feedback } from '../models/Feedback.js';

// @desc    Submit new feedback review
// @route   POST /api/feedback
// @access  Private
export const submitFeedback = async (req, res) => {
  const { rating, comments } = req.body;

  if (!rating || !comments) {
    return res.status(400).json({ success: false, message: 'Rating and comments are required fields' });
  }

  try {
    const feedback = await Feedback.create({
      studentId: req.user._id,
      studentName: req.user.name,
      rating,
      comments
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all feedback reviews list
// @route   GET /api/feedback
// @access  Private/Admin
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
    
    // Format response dates for UI
    const formatted = feedbacks.map(f => {
      const diffTime = Math.abs(new Date() - new Date(f.createdAt));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dateString = `${diffDays} days ago`;
      if (diffDays <= 1) {
        // Today or Yesterday
        const today = new Date().toDateString();
        const date = new Date(f.createdAt).toDateString();
        if (today === date) {
          dateString = `Today, ${new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          dateString = 'Yesterday';
        }
      }

      return {
        id: f._id,
        studentName: f.studentName,
        rating: f.rating,
        comments: f.comments,
        date: dateString
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
