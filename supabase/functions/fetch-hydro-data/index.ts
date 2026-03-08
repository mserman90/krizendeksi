import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fırat-Dicle basin key coordinates
const BASIN_POINTS = {
  ataturkDam: { lat: 37.47, lon: 38.33 },
  kebanDam: { lat: 38.81, lon: 38.74 },
  ilisu: { lat: 37.46, lon: 41.79 },
  birecik: { lat: 37.03, lon: 37.98 },
  basinCenter: { lat: 37.8, lon: 39.5 }, // center of Fırat-Dicle basin
};

// GloFAS river discharge model IDs near Euphrates/Tigris
// latitude/longitude pairs for flood API
const FLOOD_POINTS = [
  { lat: 37.47, lon: 38.33, name: "Atatürk" },
  { lat: 36.85, lon: 40.42, name: "Dicle-Hasankeyf" },
];

interface OpenMeteoForecast {
  daily: {
    time: string[];
    precipitation_sum: number[];
    et0_fao_evapotranspiration: number[];
    temperature_2m_mean: number[];
    soil_moisture_0_to_7cm_mean?: number[];
    snowfall_sum?: number[];
  };
}

interface OpenMeteoFlood {
  daily: {
    time: string[];
    river_discharge: number[];
    river_discharge_median?: number[];
  };
}

interface NasaPowerData {
  properties: {
    parameter: {
      PRECTOTCORR?: Record<string, number>;
      EVPTRNS?: Record<string, number>;
      T2M?: Record<string, number>;
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
    };
  };
}

interface HydroResult {
  success: boolean;
  data?: {
    precipitation: { date: string; mm: number; source: string }[];
    evapotranspiration: { date: string; mm: number; source: string }[];
    soilMoisture: { date: string; value: number }[];
    snowfall: { date: string; mm: number }[];
    riverDischarge: { date: string; m3s: number; location: string; median?: number }[];
    temperature: { date: string; celsius: number }[];
    summary: {
      totalPrecipMm: number;
      avgSoilMoisture: number;
      totalSnowfallMm: number;
      avgDischargeM3s: number;
      totalEvapMm: number;
      avgTempC: number;
      dataSourcesUsed: string[];
      fetchedAt: string;
      periodStart: string;
      periodEnd: string;
    };
  };
  errors?: string[];
  error?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchOpenMeteoForecast(
  lat: number,
  lon: number,
  pastDays: number
): Promise<{ forecast: OpenMeteoForecast | null; error?: string }> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_mean,soil_moisture_0_to_7cm_mean,snowfall_sum&past_days=${pastDays}&forecast_days=1&timezone=auto`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return { forecast: null, error: `Open-Meteo Forecast HTTP ${resp.status}: ${text}` };
    }
    const data = await resp.json();
    return { forecast: data as OpenMeteoForecast };
  } catch (e) {
    return { forecast: null, error: `Open-Meteo Forecast: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function fetchOpenMeteoFlood(
  lat: number,
  lon: number,
  pastDays: number
): Promise<{ flood: OpenMeteoFlood | null; error?: string }> {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_median&past_days=${pastDays}&forecast_days=1`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return { flood: null, error: `Open-Meteo Flood HTTP ${resp.status}: ${text}` };
    }
    const data = await resp.json();
    return { flood: data as OpenMeteoFlood };
  } catch (e) {
    return { flood: null, error: `Open-Meteo Flood: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function fetchNasaPower(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<{ data: NasaPowerData | null; error?: string }> {
  try {
    const start = startDate.replace(/-/g, "");
    const end = endDate.replace(/-/g, "");
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,EVPTRNS,T2M&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    const apiKey = Deno.env.get("NASA_POWER_API_KEY");
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const text = await resp.text();
      return { data: null, error: `NASA POWER HTTP ${resp.status}: ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    return { data: data as NasaPowerData };
  } catch (e) {
    return { data: null, error: `NASA POWER: ${e instanceof Error ? e.message : String(e)}` };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let pastDays = 14;
    try {
      const body = await req.json();
      if (body?.pastDays) pastDays = Math.min(Math.max(body.pastDays, 7), 90);
    } catch { /* no body */ }

    const errors: string[] = [];
    const sourcesUsed: string[] = [];

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - pastDays);

    // Parallel API calls
    const [meteoResult, floodResults, nasaResult] = await Promise.all([
      // Open-Meteo forecast for basin center
      fetchOpenMeteoForecast(BASIN_POINTS.basinCenter.lat, BASIN_POINTS.basinCenter.lon, pastDays),
      // Open-Meteo flood for multiple river points
      Promise.all(
        FLOOD_POINTS.map(async (p) => {
          const result = await fetchOpenMeteoFlood(p.lat, p.lon, pastDays);
          return { ...result, name: p.name };
        })
      ),
      // NASA POWER
      fetchNasaPower(
        BASIN_POINTS.basinCenter.lat,
        BASIN_POINTS.basinCenter.lon,
        formatDate(startDate),
        formatDate(now)
      ),
    ]);

    // Process precipitation
    const precipitation: { date: string; mm: number; source: string }[] = [];
    const temperature: { date: string; celsius: number }[] = [];
    const soilMoisture: { date: string; value: number }[] = [];
    const snowfall: { date: string; mm: number }[] = [];
    const evapotranspiration: { date: string; mm: number; source: string }[] = [];
    const riverDischarge: { date: string; m3s: number; location: string; median?: number }[] = [];

    // Open-Meteo data
    if (meteoResult.forecast) {
      sourcesUsed.push("Open-Meteo Forecast");
      const d = meteoResult.forecast.daily;
      for (let i = 0; i < d.time.length; i++) {
        precipitation.push({
          date: d.time[i],
          mm: d.precipitation_sum[i] ?? 0,
          source: "open-meteo",
        });
        if (d.et0_fao_evapotranspiration?.[i] != null) {
          evapotranspiration.push({
            date: d.time[i],
            mm: d.et0_fao_evapotranspiration[i],
            source: "open-meteo",
          });
        }
        if (d.temperature_2m_mean?.[i] != null) {
          temperature.push({ date: d.time[i], celsius: d.temperature_2m_mean[i] });
        }
        if (d.soil_moisture_0_to_7cm_mean?.[i] != null) {
          soilMoisture.push({ date: d.time[i], value: d.soil_moisture_0_to_7cm_mean[i] });
        }
        if (d.snowfall_sum?.[i] != null) {
          snowfall.push({ date: d.time[i], mm: d.snowfall_sum[i] });
        }
      }
    } else if (meteoResult.error) {
      errors.push(meteoResult.error);
    }

    // NASA POWER data (supplement/fallback)
    if (nasaResult.data?.properties?.parameter) {
      sourcesUsed.push("NASA POWER");
      const params = nasaResult.data.properties.parameter;

      // Add NASA precip if Open-Meteo failed
      if (precipitation.length === 0 && params.PRECTOTCORR) {
        for (const [dateStr, val] of Object.entries(params.PRECTOTCORR)) {
          if (val >= 0) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            precipitation.push({ date: formatted, mm: val, source: "nasa-power" });
          }
        }
      }

      // NASA evapotranspiration as supplement
      if (params.EVPTRNS) {
        for (const [dateStr, val] of Object.entries(params.EVPTRNS)) {
          if (val >= 0) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            evapotranspiration.push({ date: formatted, mm: val, source: "nasa-power" });
          }
        }
      }
    } else if (nasaResult.error) {
      errors.push(nasaResult.error);
    }

    // Flood/discharge data
    for (const fr of floodResults) {
      if (fr.flood) {
        sourcesUsed.push(`Open-Meteo Flood (${fr.name})`);
        const d = fr.flood.daily;
        for (let i = 0; i < d.time.length; i++) {
          if (d.river_discharge?.[i] != null) {
            riverDischarge.push({
              date: d.time[i],
              m3s: d.river_discharge[i],
              location: fr.name,
              median: d.river_discharge_median?.[i],
            });
          }
        }
      } else if (fr.error) {
        errors.push(fr.error);
      }
    }

    // Compute summary
    const totalPrecipMm = precipitation.reduce((s, p) => s + p.mm, 0);
    const avgSoilMoisture = soilMoisture.length > 0
      ? soilMoisture.reduce((s, v) => s + v.value, 0) / soilMoisture.length
      : 0;
    const totalSnowfallMm = snowfall.reduce((s, v) => s + v.mm, 0);
    const avgDischargeM3s = riverDischarge.length > 0
      ? riverDischarge.reduce((s, v) => s + v.m3s, 0) / riverDischarge.length
      : 0;
    const totalEvapMm = evapotranspiration
      .filter(e => e.source === "open-meteo")
      .reduce((s, v) => s + v.mm, 0);
    const avgTempC = temperature.length > 0
      ? temperature.reduce((s, v) => s + v.celsius, 0) / temperature.length
      : 0;

    const result: HydroResult = {
      success: true,
      data: {
        precipitation,
        evapotranspiration,
        soilMoisture,
        snowfall,
        riverDischarge,
        temperature,
        summary: {
          totalPrecipMm: Math.round(totalPrecipMm * 10) / 10,
          avgSoilMoisture: Math.round(avgSoilMoisture * 1000) / 1000,
          totalSnowfallMm: Math.round(totalSnowfallMm * 10) / 10,
          avgDischargeM3s: Math.round(avgDischargeM3s * 10) / 10,
          totalEvapMm: Math.round(totalEvapMm * 10) / 10,
          avgTempC: Math.round(avgTempC * 10) / 10,
          dataSourcesUsed: [...new Set(sourcesUsed)],
          fetchedAt: new Date().toISOString(),
          periodStart: formatDate(startDate),
          periodEnd: formatDate(now),
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Hydro data fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
