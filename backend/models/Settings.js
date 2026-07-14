import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'pricing'
  },
  breakfastOnly: { type: Number, default: 800 },
  lunchOnly: { type: Number, default: 1200 },
  dinnerOnly: { type: Number, default: 1200 },
  breakfastLunch: { type: Number, default: 1850 },
  breakfastDinner: { type: Number, default: 1850 },
  lunchDinner: { type: Number, default: 2200 },
  allMeals: { type: Number, default: 2800 }
}, {
  timestamps: true
});

export const Settings = mongoose.model('Settings', settingsSchema);
