import { supabase } from '../config/supabase.js';

export const formatMenu = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    day: row.day,
    breakfast: row.breakfast || '',
    lunch: row.lunch || '',
    dinner: row.dinner || '',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    
    async save() {
      const payload = {
        breakfast: this.breakfast,
        lunch: this.lunch,
        dinner: this.dinner,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('menu')
        .update(payload)
        .eq('id', this.id)
        .select()
        .single();
      if (error) throw error;
      return formatMenu(data);
    }
  };
};

export const Menu = {
  async find(filter = {}) {
    let query = supabase.from('menu').select('*');
    if (filter.day) {
      query = query.eq('day', filter.day);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(formatMenu);
  },

  async findOne(filter = {}) {
    let query = supabase.from('menu').select('*');
    if (filter.day) {
      query = query.eq('day', filter.day);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return formatMenu(data);
  },

  async create(menuData) {
    const payload = {
      day: menuData.day,
      breakfast: menuData.breakfast || '',
      lunch: menuData.lunch || '',
      dinner: menuData.dinner || '',
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('menu').upsert([payload], { onConflict: 'day' }).select().single();
    if (error) throw error;
    return formatMenu(data);
  },

  async insertMany(menuList) {
    const payloads = menuList.map(m => ({
      day: m.day,
      breakfast: m.breakfast || '',
      lunch: m.lunch || '',
      dinner: m.dinner || '',
      updated_at: new Date().toISOString()
    }));
    const { data, error } = await supabase.from('menu').upsert(payloads, { onConflict: 'day' }).select();
    if (error) throw error;
    return (data || []).map(formatMenu);
  }
};
