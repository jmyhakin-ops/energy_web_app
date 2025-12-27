-- Migration: Add detailed fields to sales table
-- This adds the fields used by the web app for full sales tracking
-- Run this in Supabase SQL Editor

-- Add new columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS fuel_type_id integer,
ADD COLUMN IF NOT EXISTS liters_sold numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_liter numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method character varying DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS sale_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS mpesa_transaction_id character varying;

-- Add foreign key for fuel_type_id
ALTER TABLE public.sales 
ADD CONSTRAINT sales_fuel_type_id_fkey 
FOREIGN KEY (fuel_type_id) 
REFERENCES public.fuel_types(fuel_type_id)
ON DELETE SET NULL;

-- Update existing records: copy amount to total_amount, created_at to sale_time
UPDATE public.sales 
SET total_amount = amount,
    sale_time = created_at,
    mpesa_transaction_id = mpesa_receipt_number
WHERE total_amount = 0 OR total_amount IS NULL;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_sales_sale_time ON public.sales(sale_time DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_fuel_type_id ON public.sales(fuel_type_id);

-- Grant permissions
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.sales TO anon;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sales' AND table_schema = 'public'
ORDER BY ordinal_position;
