import { Announcement } from '../models/Announcement.js';

// @desc    Get active announcements banner
// @route   GET /api/announcements
// @access  Public
export const getAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find({}).sort({ createdAt: -1 }).limit(5);
    
    // Default banner if none published
    const textList = list.length > 0 
      ? list.map(a => a.text)
      : ["📢 Welcome to Mess Tiffin Management System!", "🍲 Remember to mark your attendance daily."];

    res.json({ success: true, count: textList.length, data: textList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
export const publishAnnouncement = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Announcement text is required' });
  }

  try {
    const announcement = await Announcement.create({ text });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
