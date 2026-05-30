-- =============================================
-- MIGRATION: Alexandria v2 — Role & Team Structure
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambah kolom team ke profiles (jika belum ada)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS team TEXT DEFAULT NULL;

-- 2. Tabel team_members (yang hilang dari schema asli)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL UNIQUE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel meeting_projections (Meeting Senin & Kamis)
CREATE TABLE IF NOT EXISTS public.meeting_projections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_date DATE NOT NULL,
  meeting_day TEXT CHECK (meeting_day IN ('monday','thursday')) NOT NULL,
  team_name TEXT NOT NULL,
  presenter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  projected_closings INTEGER DEFAULT 0,
  actual_closings INTEGER DEFAULT 0,
  hot_leads_count INTEGER DEFAULT 0,
  warm_leads_count INTEGER DEFAULT 0,
  cold_leads_count INTEGER DEFAULT 0,
  agenda TEXT,
  notes TEXT,
  follow_up_actions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel rakornas (bulanan)
CREATE TABLE IF NOT EXISTS public.rakornas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_leads INTEGER DEFAULT 0,
  total_closings INTEGER DEFAULT 0,
  revenue_achievement NUMERIC(15,2) DEFAULT 0,
  target_achievement_pct NUMERIC(5,2) DEFAULT 0,
  highlights TEXT,
  challenges TEXT,
  action_plan TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','presented')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year, team_name)
);

-- 5. Seed 8 tim Alexandria
INSERT INTO public.team_members (team_name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')
ON CONFLICT (team_name) DO NOTHING;

-- 6. RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rakornas ENABLE ROW LEVEL SECURITY;

-- head_manager: akses semua
CREATE POLICY IF NOT EXISTS "head_manager_team_members_all"
  ON public.team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

CREATE POLICY IF NOT EXISTS "head_manager_meetings_all"
  ON public.meeting_projections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

CREATE POLICY IF NOT EXISTS "head_manager_rakornas_all"
  ON public.rakornas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'head_manager'
  ));

-- manager: hanya tim sendiri
CREATE POLICY IF NOT EXISTS "manager_own_meetings"
  ON public.meeting_projections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager' AND team = meeting_projections.team_name
  ));

CREATE POLICY IF NOT EXISTS "manager_own_rakornas"
  ON public.rakornas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager' AND team = rakornas.team_name
  ));

-- staff: baca meeting tim sendiri saja
CREATE POLICY IF NOT EXISTS "staff_read_meetings"
  ON public.meeting_projections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND team = meeting_projections.team_name
  ));

-- Update timestamp otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_meeting_projections_updated_at ON public.meeting_projections;
CREATE TRIGGER update_meeting_projections_updated_at
  BEFORE UPDATE ON public.meeting_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rakornas_updated_at ON public.rakornas;
CREATE TRIGGER update_rakornas_updated_at
  BEFORE UPDATE ON public.rakornas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
