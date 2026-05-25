-- ─── Alexandria Dashboard: Migration SQL ─────────────────────────────────────
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Tambah kolom baru ke tabel leads (jika belum ada)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS parent_area        TEXT,
  ADD COLUMN IF NOT EXISTS child_gender       TEXT CHECK (child_gender IN ('L','P')),
  ADD COLUMN IF NOT EXISTS has_sibling        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lead_category      TEXT CHECK (lead_category IN ('HOT','WARM','COLD','FREEZE')),
  ADD COLUMN IF NOT EXISTS interest_rating    INTEGER CHECK (interest_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS assigned_staff_name TEXT;

-- Pastikan kolom lama ada (untuk fresh install)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS handler_name   TEXT,
  ADD COLUMN IF NOT EXISTS handler_role   TEXT;

-- Refresh Supabase schema cache (penting!)
NOTIFY pgrst, 'reload schema';
