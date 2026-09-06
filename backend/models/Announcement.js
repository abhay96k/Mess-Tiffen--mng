import { supabase } from '../config/supabase.js';

export const formatAnnouncement = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    text: row.text,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
};

export const Announcement = {
  async find(filter = {}) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return (data || []).map(formatAnnouncement);
  },

  async create(data) {
    const payload = {
      text: data.text,
      updated_at: new Date().toISOString()
    };
    const { data: created, error } = await supabase.from('announcements').insert([payload]).select().single();
    if (error) throw error;
    return formatAnnouncement(created);
  }
};
