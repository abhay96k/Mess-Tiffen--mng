import { User } from '../models/User.js';

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin add a new student
// @route   POST /api/students
// @access  Private/Admin
export const addStudent = async (req, res) => {
  const { name, room, plan, status } = req.body;
  
  // Construct email and default password
  const email = `${name.toLowerCase().replace(/\s+/g, '')}@mess.com`;
  const password = 'password123'; // Default password

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A student with this name already exists' });
    }

    const student = await User.create({
      name,
      email,
      password,
      role: 'student',
      room: room || '',
      plan: plan || '2-Meal Standard',
      status: status || 'active',
      billAmount: 2400,
      billStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        room: student.room,
        plan: student.plan,
        status: student.status,
        billAmount: student.billAmount,
        billStatus: student.billStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin edit student details
// @route   PUT /api/students/:id
// @access  Private/Admin
export const updateStudent = async (req, res) => {
  const { name, room, plan, status } = req.body;

  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.name = name || student.name;
    student.room = room || student.room;
    student.plan = plan || student.plan;
    student.status = status || student.status;

    await student.save();

    res.json({
      success: true,
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        room: student.room,
        plan: student.plan,
        status: student.status,
        billAmount: student.billAmount,
        billStatus: student.billStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student record removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Settle student invoice bill
// @route   PUT /api/students/:id/pay
// @access  Private
export const payStudentBill = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Mark as paid
    student.billAmount = 0;
    student.billStatus = 'paid';

    await student.save();

    res.json({
      success: true,
      data: {
        _id: student._id,
        billAmount: student.billAmount,
        billStatus: student.billStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
