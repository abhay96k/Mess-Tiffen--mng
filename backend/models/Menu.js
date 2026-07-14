import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    unique: true
  },
  breakfast: {
    type: String,
    default: ''
  },
  lunch: {
    type: String,
    default: ''
  },
  dinner: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const Menu = mongoose.model('Menu', menuSchema);
