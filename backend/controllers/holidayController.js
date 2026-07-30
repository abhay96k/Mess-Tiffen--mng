import { Holiday } from '../models/Holiday.js';
import { User } from '../models/User.js';
import { Announcement } from '../models/Announcement.js';
import { Attendance } from '../models/Attendance.js';

// @desc    Declare a new mess holiday
// @route   POST /api/holidays
// @access  Private/Admin
export const declareHoliday = async (req, res) => {
  const { date, reason } = req.body;

  if (!date || !reason) {
    return res.status(400).json({ success: false, message: 'Date and reason are required' });
  }

  try {
    // Check if holiday already exists on this date
    let holiday = await Holiday.findOne({ date });
    if (holiday) {
      return res.status(400).json({ success: false, message: `A holiday is already declared for ${date}` });
    }

    holiday = await Holiday.create({ date, reason });

    // PUSH NOTIFICATION to all students
    const students = await User.find({ role: 'student' });
    const notificationText = `📢 Holiday Alert: The mess will be closed on ${date} due to: "${reason}".`;
    const notificationId = new Date().getTime().toString() + Math.random().toString(36).substr(2, 5);

    await Promise.all(students.map(async (student) => {
      student.notifications.push({
        id: notificationId,
        text: notificationText,
        createdAt: new Date(),
        read: false
      });
      await student.save();
    }));

    // Create a scrolling announcement banner
    await Announcement.create({
      text: `📢 HOLIDAY NOTICE: Mess closed on ${date} (${reason})`
    });

    // Automatically update/create attendance records for all students on this date to mark all meals absent
    await Promise.all(students.map(async (student) => {
      let record = await Attendance.findOne({ userId: student._id, date });
      if (record) {
        record.breakfast = false;
        record.lunch = false;
        record.dinner = false;
        record.breakfastPendingSkip = false;
        record.lunchPendingSkip = false;
        record.dinnerPendingSkip = false;
        await record.save();
      } else {
        await Attendance.create({
          userId: student._id,
          date,
          breakfast: false,
          lunch: false,
          dinner: false
        });
      }
    }));

    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all declared holidays
// @route   GET /api/holidays
// @access  Private
export const getHolidays = async (req, res) => {
  try {
    const list = await Holiday.find({}).sort({ date: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
