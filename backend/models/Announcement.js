import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Announcement = mongoose.model('Announcement', announcementSchema);
