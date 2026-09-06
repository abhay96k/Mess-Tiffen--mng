import { supabase } from '../config/supabase.js';

export const formatAttendance = (row) => {
  if (!row) return null;
  const obj = {
    _id: row.id,
    id: row.id,
    userId: row.user_id || row.userId,
    date: row.date,
    breakfast: row.breakfast !== undefined ? row.breakfast : true,
    breakfastPendingSkip: row.breakfast_pending_skip !== undefined ? row.breakfast_pending_skip : (row.breakfastPendingSkip || false),
    lunch: row.lunch !== undefined ? row.lunch : false,
    lunchPendingSkip: row.lunch_pending_skip !== undefined ? row.lunch_pending_skip : (row.lunchPendingSkip || false),
    dinner: row.dinner !== undefined ? row.dinner : true,
    dinnerPendingSkip: row.dinner_pending_skip !== undefined ? row.dinner_pending_skip : (row.dinnerPendingSkip || false),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    
    async save() {
      const payload = {
        breakfast: this.breakfast,
        breakfast_pending_skip: this.breakfastPendingSkip,
        lunch: this.lunch,
        lunch_pending_skip: this.lunchPendingSkip,
        dinner: this.dinner,
        dinner_pending_skip: this.dinnerPendingSkip,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('attendance')
        .update(payload)
        .eq('id', this.id)
        .select()
        .single();
      if (error) throw error;
      return formatAttendance(data);
    }
  };
  return obj;
};

export const Attendance = {
  // Find single attendance record
  async findOne(filter = {}) {
    let query = supabase.from('attendance').select('*');
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.date) {
      query = query.eq('date', filter.date);
    }
    if (filter.id || filter._id) {
      query = query.eq('id', filter.id || filter._id);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return formatAttendance(data);
  },

  // Find multiple attendance records
  async find(filter = {}) {
    let query = supabase.from('attendance').select('*');
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.date) {
      query = query.eq('date', filter.date);
    }
    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(formatAttendance);
  },

  // Create new attendance record
  async create(recordData) {
    const payload = {
      user_id: recordData.userId,
      date: recordData.date,
      breakfast: recordData.breakfast !== undefined ? recordData.breakfast : true,
      breakfast_pending_skip: recordData.breakfastPendingSkip || false,
      lunch: recordData.lunch !== undefined ? recordData.lunch : false,
      lunch_pending_skip: recordData.lunchPendingSkip || false,
      dinner: recordData.dinner !== undefined ? recordData.dinner : true,
      dinner_pending_skip: recordData.dinnerPendingSkip || false,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('attendance')
      .upsert([payload], { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return formatAttendance(data);
  }
};
