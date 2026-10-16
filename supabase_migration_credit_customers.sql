-- ============================================
-- Credit Customer Management Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Credit Customers table
CREATE TABLE IF NOT EXISTS credit_customers (
    credit_customer_id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Credit Payments table (payments received against outstanding credit)
CREATE TABLE IF NOT EXISTS credit_payments (
    credit_payment_id SERIAL PRIMARY KEY,
    credit_customer_id INT NOT NULL REFERENCES credit_customers(credit_customer_id),
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    received_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE credit_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (allow all for authenticated users)
CREATE POLICY "Allow all on credit_customers" ON credit_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on credit_payments" ON credit_payments FOR ALL USING (true) WITH CHECK (true);

-- 5. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_payments_customer ON credit_payments(credit_customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_customers_name ON credit_customers(customer_name);

-- 6. Optional: Add credit_customer_id to sales table for direct linking
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS credit_customer_id INT REFERENCES credit_customers(credit_customer_id);
