-- =============================================
-- DIP READINGS TABLE - Fuel Stock Management
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.dip_readings (
    dip_reading_id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES public.stations(station_id),
    fuel_type_id INTEGER NOT NULL REFERENCES public.fuel_types(fuel_type_id),
    reading_liters NUMERIC NOT NULL DEFAULT 0,
    reading_type VARCHAR DEFAULT 'manual',  -- manual, delivery, adjustment
    recorded_by INTEGER REFERENCES public.users_new(user_id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dip_readings_station_fuel ON public.dip_readings(station_id, fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_dip_readings_created_at ON public.dip_readings(created_at DESC);

-- Enable RLS
ALTER TABLE public.dip_readings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated access (adjust as needed)
CREATE POLICY "Allow all access to dip_readings" ON public.dip_readings
    FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON public.dip_readings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE dip_readings_dip_reading_id_seq TO anon, authenticated;
