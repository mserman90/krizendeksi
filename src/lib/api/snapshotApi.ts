import { supabase } from "@/integrations/supabase/client";

export interface HydroSnapshot {
  id: string;
  basin_id: string;
  crisis_index: number;
  total_precip_mm: number;
  avg_discharge_m3s: number;
  avg_soil_moisture: number;
  total_evap_mm: number;
  total_snowfall_mm: number;
  avg_humidity: number;
  avg_wind_speed: number;
  avg_solar_radiation: number;
  discharge_anomaly_ratio: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export async function saveHydroSnapshot(params: {
  basinId: string;
  crisisIndex: number;
  summary: Record<string, number>;
  periodStart: string;
  periodEnd: string;
}) {
  const { data, error } = await supabase.functions.invoke("save-hydro-snapshot", {
    body: params,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchSnapshots(basinId: string, limit = 50): Promise<HydroSnapshot[]> {
  const { data, error } = await supabase
    .from("hydro_snapshots" as any)
    .select("*")
    .eq("basin_id", basinId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as any) ?? [];
}
