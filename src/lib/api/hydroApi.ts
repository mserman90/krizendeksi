import { supabase } from "@/integrations/supabase/client";

export interface HydroDailyPrecip { date: string; mm: number; source: string; }
export interface HydroDailyEvap { date: string; mm: number; source: string; }
export interface HydroDailySoil { date: string; value: number; }
export interface HydroDailySnow { date: string; mm: number; }
export interface HydroDailyDischarge { date: string; m3s: number; location: string; median?: number; }
export interface HydroDailyTemp { date: string; celsius: number; }
export interface HydroDailyHumidity { date: string; percent: number; }
export interface HydroDailyWind { date: string; kmh: number; }
export interface HydroDailySolar { date: string; kwh: number; source: string; }

export interface HydroSummary {
  totalPrecipMm: number;
  avgSoilMoisture: number;
  totalSnowfallMm: number;
  avgDischargeM3s: number;
  totalEvapMm: number;
  avgTempC: number;
  avgHumidity: number;
  avgWindSpeed: number;
  avgSolarRadiation: number;
  dischargeAnomalyRatio: number;
  dataSourcesUsed: string[];
  fetchedAt: string;
  periodStart: string;
  periodEnd: string;
}

export interface HydroData {
  precipitation: HydroDailyPrecip[];
  evapotranspiration: HydroDailyEvap[];
  soilMoisture: HydroDailySoil[];
  snowfall: HydroDailySnow[];
  riverDischarge: HydroDailyDischarge[];
  temperature: HydroDailyTemp[];
  humidity: HydroDailyHumidity[];
  windSpeed: HydroDailyWind[];
  solarRadiation: HydroDailySolar[];
  summary: HydroSummary;
}

export interface HydroResponse {
  success: boolean;
  data?: HydroData;
  errors?: string[];
  error?: string;
}

export async function fetchHydroData(pastDays = 14): Promise<HydroResponse> {
  const { data, error } = await supabase.functions.invoke("fetch-hydro-data", {
    body: { pastDays },
  });

  if (error) {
    console.error("Hydro edge function error:", error);
    return { success: false, error: error.message };
  }

  return data as HydroResponse;
}
