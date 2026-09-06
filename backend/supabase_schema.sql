-- ====================================================================
-- Supabase Database Schema & Setup for Mess & Tiffin Management System
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  room TEXT DEFAULT '',
  plan TEXT DEFAULT '2-Meal Standard',
  status TEXT DEFAULT 'active',
  bill_amount NUMERIC DEFAULT 2400,
  bill_status TEXT DEFAULT 'pending',
  profile_image TEXT DEFAULT '',
  college_name TEXT DEFAULT '',
  pg_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  dietary_preference TEXT DEFAULT 'Veg',
  notifications JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  breakfast BOOLEAN DEFAULT true,
  breakfast_pending_skip BOOLEAN DEFAULT false,
  lunch BOOLEAN DEFAULT false,
  lunch_pending_skip BOOLEAN DEFAULT false,
  dinner BOOLEAN DEFAULT true,
  dinner_pending_skip BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- 3. Menu Table
CREATE TABLE IF NOT EXISTS public.menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL UNIQUE,
  breakfast TEXT DEFAULT '',
  lunch TEXT DEFAULT '',
  dinner TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Feedbacks Table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE DEFAULT 'pricing',
  breakfast_only NUMERIC DEFAULT 800,
  lunch_only NUMERIC DEFAULT 1200,
  dinner_only NUMERIC DEFAULT 1200,
  breakfast_lunch NUMERIC DEFAULT 1850,
  breakfast_dinner NUMERIC DEFAULT 1850,
  lunch_dinner NUMERIC DEFAULT 2200,
  all_meals NUMERIC DEFAULT 2800,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE, -- Format: YYYY-MM-DD
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if already created
DROP POLICY IF EXISTS "Allow all operations for anon/service on users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations for anon/service on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all operations for anon/service on menu" ON public.menu;
DROP POLICY IF EXISTS "Allow all operations for anon/service on feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Allow all operations for anon/service on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow all operations for anon/service on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all operations for anon/service on holidays" ON public.holidays;

-- Create policies to grant API access
CREATE POLICY "Allow all operations for anon/service on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on menu" ON public.menu FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on feedbacks" ON public.feedbacks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for anon/service on holidays" ON public.holidays FOR ALL USING (true) WITH CHECK (true);
