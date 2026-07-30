import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
    unique: true
  },
  reason: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Holiday = mongoose.model('Holiday', holidaySchema);
