import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltiwuhoietsxbprzzsba.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_54JF_Iy2ONJsK9KTgCdArA_6jsMRWRm';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing in environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export const testConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase initial query notice:', error.message);
    } else {
      console.log('Supabase client initialized successfully.');
    }
  } catch (err) {
    console.error('Supabase connection error:', err.message);
  }
};
