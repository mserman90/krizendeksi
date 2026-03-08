import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASIN_CENTER = { lat: 37.8, lon: 39.5 };
const FLOOD_POINTS = [
  { lat: 37.47, lon: 38.33, name: "Atatürk" },
  { lat: 36.85, lon: 40.42, name: "Dicle-Hasankeyf" },
];

const THRESHOLD = 60; // Crisis index threshold

function normalize(value: number | null, minVal: number, maxVal: number, invert = false): number {
  if (value === null) return 50.0;
  if (maxVal === minVal) return 50.0;
  let ratio = (value - minVal) / (maxVal - minVal);
  ratio = Math.max(0.0, Math.min(1.0, ratio));
  if (invert) ratio = 1.0 - ratio;
  return ratio * 100.0;
}

function getCrisisLevel(index: number): string {
  if (index < 25) return "low";
  if (index < 50) return "medium";
  if (index < 75) return "high";
  return "critical";
}

async function fetchMeteoSummary(pastDays = 14) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${BASIN_CENTER.lat}&longitude=${BASIN_CENTER.lon}&daily=precipitation_sum,et0_fao_evapotranspiration,soil_moisture_0_to_7cm_mean,snowfall_sum,relative_humidity_2m_mean,wind_speed_10m_max&past_days=${pastDays}&forecast_days=1&timezone=auto`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  const d = data.daily;
  const len = d.time.length;

  const totalPrecip = d.precipitation_sum.reduce((s: number, v: number) => s + (v ?? 0), 0);
  const totalEvap = d.et0_fao_evapotranspiration.reduce((s: number, v: number) => s + (v ?? 0), 0);
  const totalSnow = d.snowfall_sum.reduce((s: number, v: number) => s + (v ?? 0), 0);
  const avgSoil = d.soil_moisture_0_to_7cm_mean.filter((v: number) => v != null).reduce((s: number, v: number) => s + v, 0) / len;
  const avgHumidity = d.relative_humidity_2m_mean.filter((v: number) => v != null).reduce((s: number, v: number) => s + v, 0) / len;
  const avgWind = d.wind_speed_10m_max.filter((v: number) => v != null).reduce((s: number, v: number) => s + v, 0) / len;

  return { totalPrecip, totalEvap, totalSnow, avgSoil, avgHumidity, avgWind };
}

async function fetchDischargeSummary(pastDays = 14) {
  let totalDischarge = 0;
  let count = 0;
  let anomalySum = 0;
  let anomalyCount = 0;

  for (const p of FLOOD_POINTS) {
    try {
      const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${p.lat}&longitude=${p.lon}&daily=river_discharge,river_discharge_median&past_days=${pastDays}&forecast_days=1`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      for (let i = 0; i < data.daily.time.length; i++) {
        if (data.daily.river_discharge[i] != null) {
          totalDischarge += data.daily.river_discharge[i];
          count++;
          if (data.daily.river_discharge_median?.[i] > 0) {
            anomalySum += data.daily.river_discharge[i] / data.daily.river_discharge_median[i];
            anomalyCount++;
          }
        }
      }
    } catch { /* skip */ }
  }

  return {
    avgDischarge: count > 0 ? totalDischarge / count : 0,
    anomalyRatio: anomalyCount > 0 ? anomalySum / anomalyCount : 1.0,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [meteo, discharge] = await Promise.all([
      fetchMeteoSummary(14),
      fetchDischargeSummary(14),
    ]);

    if (!meteo) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch meteo data" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute crisis index (same formula as frontend)
    const precipScore = normalize(meteo.totalPrecip, 0, 80, true);
    const dischargeScore = normalize(discharge.avgDischarge, 200, 2000, true);
    const dischargeAnomalyScore = normalize(discharge.anomalyRatio, 0.3, 1.5, true);
    const soilMoistureScore = normalize(meteo.avgSoil, 0.05, 0.45, true);
    const evapScore = normalize(meteo.totalEvap, 0, 70, false);
    const snowScore = normalize(meteo.totalSnow, 0, 50, true);
    const humidityScore = normalize(meteo.avgHumidity, 20, 90, true);
    const windScore = normalize(meteo.avgWind, 0, 60, false);
    // Solar radiation not fetched here for simplicity, use neutral
    const solarScore = 50;

    const crisisIndex =
      0.18 * precipScore +
      0.20 * dischargeScore +
      0.10 * dischargeAnomalyScore +
      0.14 * soilMoistureScore +
      0.10 * evapScore +
      0.08 * solarScore +
      0.08 * humidityScore +
      0.06 * windScore +
      0.06 * snowScore;

    const level = getCrisisLevel(crisisIndex);
    const roundedIndex = Math.round(crisisIndex * 10) / 10;

    const summary = {
      precipScore: Math.round(precipScore),
      dischargeScore: Math.round(dischargeScore),
      dischargeAnomalyScore: Math.round(dischargeAnomalyScore),
      soilMoistureScore: Math.round(soilMoistureScore),
      evapScore: Math.round(evapScore),
      snowScore: Math.round(snowScore),
      humidityScore: Math.round(humidityScore),
      windScore: Math.round(windScore),
      avgDischarge: Math.round(discharge.avgDischarge),
      totalPrecip: Math.round(meteo.totalPrecip * 10) / 10,
    };

    // Only insert alert if threshold exceeded
    if (roundedIndex >= THRESHOLD) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check if we already have an alert in the last 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("crisis_alerts")
        .select("id")
        .gte("created_at", sixHoursAgo)
        .limit(1);

      if (!recent || recent.length === 0) {
        await supabase.from("crisis_alerts").insert({
          crisis_index: roundedIndex,
          threshold: THRESHOLD,
          level,
          summary,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      crisisIndex: roundedIndex,
      level,
      thresholdExceeded: roundedIndex >= THRESHOLD,
      summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Crisis check error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
