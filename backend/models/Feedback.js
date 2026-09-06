import { supabase } from '../config/supabase.js';

export const formatFeedback = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.student_id || row.studentId,
    studentName: row.student_name || row.studentName,
    rating: row.rating,
    comments: row.comments,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
};

export const Feedback = {
  async create(feedbackData) {
    const payload = {
      student_id: feedbackData.studentId,
      student_name: feedbackData.studentName,
      rating: Number(feedbackData.rating),
      comments: feedbackData.comments,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('feedbacks').insert([payload]).select().single();
    if (error) throw error;
    return formatFeedback(data);
  },

  async find(filter = {}) {
    let query = supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(formatFeedback);
  }
};
