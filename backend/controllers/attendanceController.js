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
        userId: s._id,
        name: s.name,
        room: s.room || 'N/A',
        breakfast: record ? (record.breakfast ? 'Present' : 'Absent') : 'Present', // Default
        breakfastPendingSkip: record ? record.breakfastPendingSkip : false,
        lunch: record ? (record.lunch ? 'Present' : 'Absent') : 'Absent',           // Default
        lunchPendingSkip: record ? record.lunchPendingSkip : false,
        dinner: record ? (record.dinner ? 'Present' : 'Absent') : 'Present',          // Default
        dinnerPendingSkip: record ? record.dinnerPendingSkip : false
      };
    });

    res.json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin manually update/override attendance for a specific student
// @route   PUT /api/attendance/update
// @access  Private/Admin
export const updateStudentAttendance = async (req, res) => {
  const { userId, meal, status } = req.body; // status is boolean (true = Present, false = Absent)
  const date = getTodayDateString();

  if (!userId || !meal || !['breakfast', 'lunch', 'dinner'].includes(meal)) {
    return res.status(400).json({ success: false, message: 'Missing parameters or invalid meal.' });
  }

  try {
    let record = await Attendance.findOne({ userId, date });

    if (!record) {
      record = new Attendance({
        userId,
        date,
        breakfast: true,
        lunch: false,
        dinner: true
      });
    }

    record[meal] = status;
    // Clear pending skip when admin confirm/update
    record[`${meal}PendingSkip`] = false;
    await record.save();

    // Push notification to Student
    const mealLabel = meal.charAt(0).toUpperCase() + meal.slice(1);
    const text = `Your ${mealLabel} attendance today was marked ${status ? 'Present' : 'Absent'} by the administrator.`;
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 5),
          text,
          createdAt: new Date(),
          read: false
        }
      }
    });

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student requests to skip/be absent for a meal today
// @route   POST /api/attendance/request-skip
// @access  Private
export const applySkipMealAttendance = async (req, res) => {
  const { meal } = req.body;
  const date = getTodayDateString();
  const userId = req.user._id;

  if (!['breakfast', 'lunch', 'dinner'].includes(meal)) {
    return res.status(400).json({ success: false, message: 'Invalid meal. Must be breakfast, lunch, or dinner.' });
  }

  // Time cutoff validation (Breakfast: 7 AM, Lunch: 11 AM, Dinner: 6 PM Kolkata Time)
  const d = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
  const timeString = d.toLocaleTimeString('en-US', options);
  const [hour, minute] = timeString.split(':').map(Number);

  if (meal === 'breakfast' && hour >= 7) {
    return res.status(400).json({ success: false, message: 'Cut-off time exceeded! Skip requests for breakfast must be submitted before 7:00 AM.' });
  }
  if (meal === 'lunch' && hour >= 11) {
    return res.status(400).json({ success: false, message: 'Cut-off time exceeded! Skip requests for lunch must be submitted before 11:00 AM.' });
  }
  if (meal === 'dinner' && hour >= 18) {
    return res.status(400).json({ success: false, message: 'Cut-off time exceeded! Skip requests for dinner must be submitted before 6:00 PM.' });
  }

  try {
    let record = await Attendance.findOne({ userId, date });

    if (!record) {
      // Create defaults
      record = new Attendance({
        userId,
        date,
        breakfast: true,
        lunch: false,
        dinner: true
      });
    }

    // Set pending skip to true for that meal
    record[`${meal}PendingSkip`] = true;
    await record.save();

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current student's attendance history
// @route   GET /api/attendance/history
// @access  Private
export const getStudentAttendanceHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const history = await Attendance.find({ userId }).sort({ date: -1 }).limit(30);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
