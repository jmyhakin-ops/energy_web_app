-- Migration: Add shift_expenses column to pump_shifts table
-- This stores pump-attendant expenses during a shift (e.g., fuel floats, small purchases)
-- Cash formula becomes: Cash Sales = Total Sales - M-Pesa - Credit - Expenses

ALTER TABLE public.pump_shifts
ADD COLUMN IF NOT EXISTS shift_expenses numeric DEFAULT 0;

COMMENT ON COLUMN public.pump_shifts.shift_expenses IS 'Expenses incurred during the shift, subtracted from cash sales';
