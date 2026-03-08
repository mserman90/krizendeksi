
CREATE TABLE public.hydro_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  basin_id text NOT NULL,
  crisis_index numeric NOT NULL,
  total_precip_mm numeric NOT NULL DEFAULT 0,
  avg_discharge_m3s numeric NOT NULL DEFAULT 0,
  avg_soil_moisture numeric NOT NULL DEFAULT 0,
  total_evap_mm numeric NOT NULL DEFAULT 0,
  total_snowfall_mm numeric NOT NULL DEFAULT 0,
  avg_humidity numeric NOT NULL DEFAULT 0,
  avg_wind_speed numeric NOT NULL DEFAULT 0,
  avg_solar_radiation numeric NOT NULL DEFAULT 0,
  discharge_anomaly_ratio numeric NOT NULL DEFAULT 1,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hydro_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.hydro_snapshots FOR SELECT USING (true);
CREATE POLICY "Service role insert" ON public.hydro_snapshots FOR INSERT WITH CHECK (true);

CREATE INDEX idx_hydro_snapshots_basin_date ON public.hydro_snapshots (basin_id, created_at DESC);
