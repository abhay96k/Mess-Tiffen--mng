import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';

// Helper to get formatted local date (YYYY-MM-DD)
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get logged-in student's attendance for today
// @route   GET /api/attendance/today
// @access  Private
export const getTodayAttendance = async (req, res) => {
  const date = getTodayDateString();
  const userId = req.user._id;

  try {
    let record = await Attendance.findOne({ userId, date });

    if (!record) {
      // Create default record
      record = await Attendance.create({
        userId,
        date,
        breakfast: true,
        lunch: false,
        dinner: true
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a specific meal marker for today
// @route   POST /api/attendance/toggle
// @access  Private
export const toggleMealAttendance = async (req, res) => {
  const { meal } = req.body;
  const date = getTodayDateString();
  const userId = req.user._id;

  if (!['breakfast', 'lunch', 'dinner'].includes(meal)) {
    return res.status(400).json({ success: false, message: 'Invalid meal identifier. Must be breakfast, lunch, or dinner.' });
  }

  try {
    let record = await Attendance.findOne({ userId, date });

    if (!record) {
      // Create default before toggling
      record = new Attendance({
        userId,
        date,
        breakfast: true,
        lunch: false,
        dinner: true
      });
    }

    // Toggle target meal
    record[meal] = !record[meal];
    await record.save();

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get combined attendance tracker for today
// @route   GET /api/attendance/summary
// @access  Private/Admin
export const getAttendanceSummary = async (req, res) => {
  const date = getTodayDateString();

  try {
    // Fetch all active students
    const students = await User.find({ role: 'student', status: 'active' });
    
    // Fetch today's records
    const attendanceRecords = await Attendance.find({ date });

    // Build map for quick lookups
    const recordMap = new Map();
    attendanceRecords.forEach(r => recordMap.set(r.userId.toString(), r));

    // Map students to unified list
    const summary = students.map(s => {
      const record = recordMap.get(s._id.toString());
      return {
        name: s.name,
        room: s.room || 'N/A',
        breakfast: record ? (record.breakfast ? 'Present' : 'Absent') : 'Present', // Default
        lunch: record ? (record.lunch ? 'Present' : 'Absent') : 'Absent',           // Default
        dinner: record ? (record.dinner ? 'Present' : 'Absent') : 'Present'          // Default
      };
    });

    res.json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
