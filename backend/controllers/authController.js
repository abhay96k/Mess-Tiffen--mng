import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mess_tiffin_jwt_secret_key_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, role, room, plan } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      room: room || '',
      plan: plan || '2-Meal Standard'
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify role matches login context
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Access denied. Selected account is not registered as an ${role}.` });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        room: user.room,
        plan: user.plan,
        status: user.status,
        billAmount: user.billAmount,
        billStatus: user.billStatus,
        profileImage: user.profileImage || '',
        notifications: user.notifications || [],
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        room: user.room,
        plan: user.plan,
        status: user.status,
        billAmount: user.billAmount,
        billStatus: user.billStatus,
        profileImage: user.profileImage || '',
        notifications: user.notifications || []
      });
    } else {
      res.status(404).json({ success: false, message: 'User profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (name, image)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.profileImage !== undefined) {
        user.profileImage = req.body.profileImage;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        room: updatedUser.room,
        plan: updatedUser.plan,
        status: updatedUser.status,
        billAmount: updatedUser.billAmount,
        billStatus: updatedUser.billStatus,
        profileImage: updatedUser.profileImage || '',
        notifications: updatedUser.notifications || []
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/auth/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.notifications = user.notifications.map(n => ({ ...n, read: true }));
      await user.save();
      res.json({ success: true, notifications: user.notifications });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

