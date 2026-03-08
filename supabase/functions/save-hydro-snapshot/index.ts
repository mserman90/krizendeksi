import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { basinId, crisisIndex, summary, periodStart, periodEnd } = body;

    if (!basinId || crisisIndex == null || !summary) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("hydro_snapshots").insert({
      basin_id: basinId,
      crisis_index: crisisIndex,
      total_precip_mm: summary.totalPrecipMm ?? 0,
      avg_discharge_m3s: summary.avgDischargeM3s ?? 0,
      avg_soil_moisture: summary.avgSoilMoisture ?? 0,
      total_evap_mm: summary.totalEvapMm ?? 0,
      total_snowfall_mm: summary.totalSnowfallMm ?? 0,
      avg_humidity: summary.avgHumidity ?? 0,
      avg_wind_speed: summary.avgWindSpeed ?? 0,
      avg_solar_radiation: summary.avgSolarRadiation ?? 0,
      discharge_anomaly_ratio: summary.dischargeAnomalyRatio ?? 1,
      period_start: periodStart,
      period_end: periodEnd,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Save snapshot error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
