import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';

// Route imports
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import menuRoutes from './routes/menu.js';
import attendanceRoutes from './routes/attendance.js';
import feedbackRoutes from './routes/feedback.js';
import announcementRoutes from './routes/announcements.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/settings', settingsRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Mess Tiffin Management System API is running...');
});

// Port and start server
const PORT = process.env.PORT || 5000;

// Database Connection & Seed Admin/Student
const startServer = async () => {
  await connectDB();

  try {
    // Seed default credentials if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default admin and student credentials...');
      
      // Default Admin
      await User.create({
        name: 'System Administrator',
        email: 'admin@mess.com',
        password: 'password123',
        role: 'admin'
      });

      // Default Student
      await User.create({
        name: 'Abhay Chavan',
        email: 'student@mess.com',
        password: 'password123',
        role: 'student',
        room: '304',
        plan: '2-Meal Standard',
        status: 'active',
        billAmount: 2400,
        billStatus: 'pending'
      });

      console.log('Default credentials seeded successfully.');
      console.log('Admin Email: admin@mess.com | Pass: password123');
      console.log('Student Email: student@mess.com | Pass: password123');
    } else {
      // Auto-update existing seeded student from Alex Johnson to Abhay Chavan
      await User.updateMany(
        { email: 'student@mess.com', name: 'Alex Johnson' },
        { name: 'Abhay Chavan' }
      );
    }
  } catch (err) {
    console.error('Error seeding default users:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running in production-ready mode on port ${PORT}`);
  });
};

startServer();
