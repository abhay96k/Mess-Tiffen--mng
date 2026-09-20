import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';

// Helper to format Supabase user row to standard model object
export const formatUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    password: row.password || '',
    role: row.role || 'student',
    room: row.room || '',
    plan: row.plan || '2-Meal Standard',
    status: row.status || 'active',
    billAmount: Number(row.bill_amount !== undefined ? row.bill_amount : (row.billAmount || 0)),
    billStatus: row.bill_status || row.billStatus || 'pending',
    profileImage: row.profile_image || row.profileImage || '',
    collegeName: row.college_name || row.collegeName || '',
    pgName: row.pg_name || row.pgName || '',
    phone: row.phone || '',
    dietaryPreference: row.dietary_preference || row.dietaryPreference || 'Veg',
    notifications: Array.isArray(row.notifications) ? row.notifications : [],
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    
    // Method to compare password
    async comparePassword(enteredPassword) {
      if (!this.password) return false;
      if (enteredPassword === this.password) return true;
      try {
        return await bcrypt.compare(enteredPassword, this.password);
      } catch {
        return false;
      }
    },

    // Method to save/persist updates to Supabase
    async save() {
      const payload = {
        name: this.name,
        email: this.email ? this.email.toLowerCase().trim() : undefined,
        role: this.role,
        room: this.room,
        plan: this.plan,
        status: this.status,
        bill_amount: this.billAmount,
        bill_status: this.billStatus,
        profile_image: this.profileImage,
        college_name: this.collegeName,
        pg_name: this.pgName,
        phone: this.phone,
        dietary_preference: this.dietaryPreference,
        notifications: this.notifications,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', this.id)
        .select()
        .single();
      if (error) throw error;
      return formatUser(data);
    }
  };
};

export const User = {
  // Count total users
  async countDocuments(filter = {}) {
    let query = supabase.from('users').select('*', { count: 'exact', head: true });
    if (filter.role) {
      query = query.eq('role', filter.role);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  // Find multiple users
  async find(filter = {}) {
    let query = supabase.from('users').select('*');
    if (filter.role) {
      query = query.eq('role', filter.role);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(formatUser);
  },

  // Find user by single criteria (email or id)
  async findOne(filter = {}) {
    let query = supabase.from('users').select('*');
    if (filter.email) {
      query = query.eq('email', filter.email.toLowerCase().trim());
    }
    if (filter.id || filter._id) {
      query = query.eq('id', filter.id || filter._id);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return formatUser(data);
  },

  // Find user by ID
  async findById(id) {
    if (!id) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return formatUser(data);
  },

  // Create new user (with bcrypt hash)
  async create(userData) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const payload = {
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      role: userData.role || 'student',
      room: userData.room || '',
      plan: userData.plan || '2-Meal Standard',
      status: userData.status || 'active',
      bill_amount: userData.billAmount !== undefined ? userData.billAmount : 2400,
      bill_status: userData.billStatus || 'pending',
      profile_image: userData.profileImage || '',
      college_name: userData.collegeName || '',
      pg_name: userData.pgName || '',
      phone: userData.phone || '',
      dietary_preference: userData.dietaryPreference || 'Veg',
      notifications: userData.notifications || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) throw error;
    return formatUser(data);
  },

  // Update user by ID
  async findByIdAndUpdate(id, updateData, options = {}) {
    const payload = { updated_at: new Date().toISOString() };
    
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.email !== undefined) payload.email = updateData.email.toLowerCase().trim();
    if (updateData.room !== undefined) payload.room = updateData.room;
    if (updateData.plan !== undefined) payload.plan = updateData.plan;
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.billAmount !== undefined) payload.bill_amount = updateData.billAmount;
    if (updateData.billStatus !== undefined) payload.bill_status = updateData.billStatus;
    if (updateData.profileImage !== undefined) payload.profile_image = updateData.profileImage;
    if (updateData.collegeName !== undefined) payload.college_name = updateData.collegeName;
    if (updateData.pgName !== undefined) payload.pg_name = updateData.pgName;
    if (updateData.phone !== undefined) payload.phone = updateData.phone;
    if (updateData.dietaryPreference !== undefined) payload.dietary_preference = updateData.dietaryPreference;
    if (updateData.notifications !== undefined) payload.notifications = updateData.notifications;

    if (updateData.$push && updateData.$push.notifications) {
      // Handle $push notification
      const existing = await this.findById(id);
      const currentNotifications = existing ? (existing.notifications || []) : [];
      payload.notifications = [...currentNotifications, updateData.$push.notifications];
    }

    const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return formatUser(data);
  },

  // Delete user by ID
  async findByIdAndDelete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Update multiple users
  async updateMany(filter = {}, update = {}) {
    let query = supabase.from('users').update(update);
    if (filter.email) query = query.eq('email', filter.email);
    if (filter.name) query = query.eq('name', filter.name);
    const { error } = await query;
    if (error) throw error;
    return true;
  }
};
