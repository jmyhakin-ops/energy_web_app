-- Add sales breakdown columns to pump_shifts table
-- These store the shift-end sales summary for permanent records

ALTER TABLE public.pump_shifts
  ADD COLUMN IF NOT EXISTS total_liters numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mpesa_sales numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_sales numeric DEFAULT 0;
