-- =====================================================
-- MIGRATION: Change salary_advances to use users_new table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop existing foreign key constraints
ALTER TABLE salary_advances 
DROP CONSTRAINT IF EXISTS salary_advances_user_id_fkey;

ALTER TABLE salary_advances 
DROP CONSTRAINT IF EXISTS salary_advances_approved_by_fkey;

-- Step 2: Change user_id column from UUID to INT
-- First, we need to clear the data or migrate it
-- Option A: If you have no data, just alter the column:
ALTER TABLE salary_advances 
ALTER COLUMN user_id TYPE INTEGER USING NULL;

-- Option B: If approved_by also needs to change
ALTER TABLE salary_advances 
ALTER COLUMN approved_by TYPE INTEGER USING NULL;

-- Step 3: Add new foreign key constraints referencing users_new
ALTER TABLE salary_advances 
ADD CONSTRAINT salary_advances_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users_new(user_id) ON DELETE CASCADE;

ALTER TABLE salary_advances 
ADD CONSTRAINT salary_advances_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES users_new(user_id) ON DELETE SET NULL;

-- Step 4: Verify the changes
-- Run this to check the table structure:
-- \d salary_advances

-- =====================================================
-- ALTERNATIVE: If you have existing data to preserve
-- =====================================================
-- If you have existing salary_advances data linked to users(id) UUIDs,
-- you would need to:
-- 1. Create a mapping between users.id (UUID) and users_new.user_id (INT)
-- 2. Update salary_advances.user_id to the INT values
-- 3. Then alter the column type and constraints
--
-- Example (only if you have data to migrate):
-- UPDATE salary_advances sa
-- SET user_id = (SELECT un.user_id FROM users_new un 
--                JOIN users u ON u.phone = un.mobile_no 
--                WHERE u.id = sa.user_id::uuid)::text
-- WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = sa.user_id::uuid);
