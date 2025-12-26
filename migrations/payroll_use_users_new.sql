-- =====================================================
-- MIGRATION: Change payroll table to use users_new table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing foreign key constraints
ALTER TABLE payroll 
DROP CONSTRAINT IF EXISTS payroll_user_id_fkey;

ALTER TABLE payroll 
DROP CONSTRAINT IF EXISTS payroll_created_by_fkey;

-- Step 2: Change user_id column from UUID to INT
ALTER TABLE payroll 
ALTER COLUMN user_id TYPE INTEGER USING NULL;

ALTER TABLE payroll 
ALTER COLUMN created_by TYPE INTEGER USING NULL;

-- Step 3: Add new foreign key constraints referencing users_new
ALTER TABLE payroll 
ADD CONSTRAINT payroll_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users_new(user_id) ON DELETE CASCADE;

ALTER TABLE payroll 
ADD CONSTRAINT payroll_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users_new(user_id) ON DELETE SET NULL;

-- Step 4: Fix RLS policies
DROP POLICY IF EXISTS "Allow authenticated access to payroll" ON payroll;
DROP POLICY IF EXISTS "Allow select payroll" ON payroll;
DROP POLICY IF EXISTS "Allow insert payroll" ON payroll;
DROP POLICY IF EXISTS "Allow update payroll" ON payroll;
DROP POLICY IF EXISTS "Allow delete payroll" ON payroll;

CREATE POLICY "Allow select payroll" ON payroll
    FOR SELECT USING (true);

CREATE POLICY "Allow insert payroll" ON payroll
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update payroll" ON payroll
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete payroll" ON payroll
    FOR DELETE USING (true);

-- Step 5: Grant permissions
GRANT ALL ON payroll TO anon;
GRANT ALL ON payroll TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE payroll_payroll_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE payroll_payroll_id_seq TO authenticated;

-- =====================================================
-- Verify changes
-- =====================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'payroll' AND column_name IN ('user_id', 'created_by');
