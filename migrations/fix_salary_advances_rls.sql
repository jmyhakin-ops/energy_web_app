-- =====================================================
-- FIX RLS POLICY FOR salary_advances TABLE
-- Run this in Supabase SQL Editor
-- =====================================================

-- Option 1: Allow all authenticated users (recommended for admin apps)
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to salary_advances" ON salary_advances;
DROP POLICY IF EXISTS "Allow insert salary_advances" ON salary_advances;
DROP POLICY IF EXISTS "Allow update salary_advances" ON salary_advances;
DROP POLICY IF EXISTS "Allow delete salary_advances" ON salary_advances;
DROP POLICY IF EXISTS "Allow select salary_advances" ON salary_advances;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow select salary_advances" ON salary_advances
    FOR SELECT USING (true);

CREATE POLICY "Allow insert salary_advances" ON salary_advances
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update salary_advances" ON salary_advances
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete salary_advances" ON salary_advances
    FOR DELETE USING (true);

-- =====================================================
-- Option 2: If above doesn't work, disable RLS temporarily
-- (Use only if Option 1 fails)
-- =====================================================
-- ALTER TABLE salary_advances DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Option 3: Grant full access to anon and authenticated roles
-- =====================================================
GRANT ALL ON salary_advances TO anon;
GRANT ALL ON salary_advances TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE salary_advances_advance_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE salary_advances_advance_id_seq TO authenticated;
