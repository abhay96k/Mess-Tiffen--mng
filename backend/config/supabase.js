import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { localDB } from './localDb.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let isSupabaseHealthy = false;
let realSupabaseClient = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your_supabase')) {
  try {
    realSupabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err.message);
  }
}

export const testConnection = async () => {
  if (!realSupabaseClient) {
    console.log('Using Local Resilient Database mode (data persisted in backend/data/local_db.json).');
    isSupabaseHealthy = false;
    return;
  }

  try {
    const { error } = await realSupabaseClient.from('users').select('id').limit(1);
    if (!error || error.code === 'PGRST116') {
      isSupabaseHealthy = true;
      console.log('Connected to remote Supabase database successfully.');
    } else {
      console.warn('Supabase service notice:', error.message);
      console.log('Operating in Local Resilient Database mode.');
      isSupabaseHealthy = false;
    }
  } catch (err) {
    console.log('Remote Supabase unreachable (' + err.message + '). Operating in Local Resilient Database mode.');
    isSupabaseHealthy = false;
  }
};

export const supabase = {
  from(tableName) {
    if (isSupabaseHealthy && realSupabaseClient) {
      return realSupabaseClient.from(tableName);
    }
    return localDB.from(tableName);
  }
};
