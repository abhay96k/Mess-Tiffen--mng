import { supabase } from '../config/supabase.js';

export const formatHoliday = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    date: row.date,
    reason: row.reason,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
};

export const Holiday = {
  async findOne(filter = {}) {
    let query = supabase.from('holidays').select('*');
    if (filter.date) {
      query = query.eq('date', filter.date);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return formatHoliday(data);
  },

  async find(filter = {}) {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(formatHoliday);
  },

  async create(holidayData) {
    const payload = {
      date: holidayData.date,
      reason: holidayData.reason,
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('holidays').insert([payload]).select().single();
    if (error) throw error;
    return formatHoliday(data);
  }
};
