import { supabase } from '../config/supabase.js';

export const formatSettings = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    key: row.key || 'pricing',
    breakfastOnly: Number(row.breakfast_only !== undefined ? row.breakfast_only : (row.breakfastOnly || 800)),
    lunchOnly: Number(row.lunch_only !== undefined ? row.lunch_only : (row.lunchOnly || 1200)),
    dinnerOnly: Number(row.dinner_only !== undefined ? row.dinner_only : (row.dinnerOnly || 1200)),
    breakfastLunch: Number(row.breakfast_lunch !== undefined ? row.breakfast_lunch : (row.breakfastLunch || 1850)),
    breakfastDinner: Number(row.breakfast_dinner !== undefined ? row.breakfast_dinner : (row.breakfastDinner || 1850)),
    lunchDinner: Number(row.lunch_dinner !== undefined ? row.lunch_dinner : (row.lunchDinner || 2200)),
    allMeals: Number(row.all_meals !== undefined ? row.all_meals : (row.allMeals || 2800)),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    
    async save() {
      const payload = {
        key: this.key || 'pricing',
        breakfast_only: this.breakfastOnly,
        lunch_only: this.lunchOnly,
        dinner_only: this.dinnerOnly,
        breakfast_lunch: this.breakfastLunch,
        breakfast_dinner: this.breakfastDinner,
        lunch_dinner: this.lunchDinner,
        all_meals: this.allMeals,
        updated_at: new Date().toISOString()
      };
      
      let query;
      if (this.id) {
        query = supabase.from('settings').update(payload).eq('id', this.id).select().single();
      } else {
        query = supabase.from('settings').upsert([payload], { onConflict: 'key' }).select().single();
      }
      const { data, error } = await query;
      if (error) throw error;
      return formatSettings(data);
    }
  };
};

export const Settings = {
  async findOne(filter = {}) {
    let query = supabase.from('settings').select('*');
    if (filter.key) {
      query = query.eq('key', filter.key);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return formatSettings(data);
  },

  async create(data) {
    const payload = {
      key: data.key || 'pricing',
      breakfast_only: data.breakfastOnly !== undefined ? data.breakfastOnly : 800,
      lunch_only: data.lunchOnly !== undefined ? data.lunchOnly : 1200,
      dinner_only: data.dinnerOnly !== undefined ? data.dinnerOnly : 1200,
      breakfast_lunch: data.breakfastLunch !== undefined ? data.breakfastLunch : 1850,
      breakfast_dinner: data.breakfastDinner !== undefined ? data.breakfastDinner : 1850,
      lunch_dinner: data.lunchDinner !== undefined ? data.lunchDinner : 2200,
      all_meals: data.allMeals !== undefined ? data.allMeals : 2800,
      updated_at: new Date().toISOString()
    };
    const { data: created, error } = await supabase.from('settings').upsert([payload], { onConflict: 'key' }).select().single();
    if (error) throw error;
    return formatSettings(created);
  }
};
