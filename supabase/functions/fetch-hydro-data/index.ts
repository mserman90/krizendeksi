import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASIN_POINTS = {
  basinCenter: { lat: 37.8, lon: 39.5 },
};

const FLOOD_POINTS = [
  { lat: 37.47, lon: 38.33, name: "Atatürk" },
  { lat: 36.85, lon: 40.42, name: "Dicle-Hasankeyf" },
];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchOpenMeteoForecast(lat: number, lon: number, pastDays: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_mean,soil_moisture_0_to_7cm_mean,snowfall_sum,relative_humidity_2m_mean,wind_speed_10m_max&past_days=${pastDays}&forecast_days=1&timezone=auto`;
    const resp = await fetch(url);
    if (!resp.ok) return { forecast: null, error: `Open-Meteo Forecast HTTP ${resp.status}` };
    return { forecast: await resp.json() };
  } catch (e) {
    return { forecast: null, error: `Open-Meteo Forecast: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function fetchOpenMeteoFlood(lat: number, lon: number, pastDays: number) {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge,river_discharge_median&past_days=${pastDays}&forecast_days=1`;
    const resp = await fetch(url);
    if (!resp.ok) return { flood: null, error: `Open-Meteo Flood HTTP ${resp.status}` };
    return { flood: await resp.json() };
  } catch (e) {
    return { flood: null, error: `Open-Meteo Flood: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function fetchNasaPower(lat: number, lon: number, startDate: string, endDate: string) {
  try {
    const start = startDate.replace(/-/g, "");
    const end = endDate.replace(/-/g, "");
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,EVPTRNS,T2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    const apiKey = Deno.env.get("NASA_POWER_API_KEY");
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) return { data: null, error: `NASA POWER HTTP ${resp.status}` };
    return { data: await resp.json() };
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

    const [meteoResult, floodResults, nasaResult] = await Promise.all([
      fetchOpenMeteoForecast(BASIN_POINTS.basinCenter.lat, BASIN_POINTS.basinCenter.lon, pastDays),
      Promise.all(FLOOD_POINTS.map(async (p) => {
        const result = await fetchOpenMeteoFlood(p.lat, p.lon, pastDays);
        return { ...result, name: p.name };
      })),
      fetchNasaPower(BASIN_POINTS.basinCenter.lat, BASIN_POINTS.basinCenter.lon, formatDate(startDate), formatDate(now)),
    ]);

    const precipitation: { date: string; mm: number; source: string }[] = [];
    const temperature: { date: string; celsius: number }[] = [];
    const soilMoisture: { date: string; value: number }[] = [];
    const snowfall: { date: string; mm: number }[] = [];
    const evapotranspiration: { date: string; mm: number; source: string }[] = [];
    const riverDischarge: { date: string; m3s: number; location: string; median?: number }[] = [];
    const humidity: { date: string; percent: number }[] = [];
    const windSpeed: { date: string; kmh: number }[] = [];
    const solarRadiation: { date: string; kwh: number; source: string }[] = [];

    // Open-Meteo data
    if (meteoResult.forecast) {
      sourcesUsed.push("Open-Meteo Forecast");
      const d = meteoResult.forecast.daily;
      for (let i = 0; i < d.time.length; i++) {
        precipitation.push({ date: d.time[i], mm: d.precipitation_sum[i] ?? 0, source: "open-meteo" });
        if (d.et0_fao_evapotranspiration?.[i] != null) {
          evapotranspiration.push({ date: d.time[i], mm: d.et0_fao_evapotranspiration[i], source: "open-meteo" });
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
        if (d.relative_humidity_2m_mean?.[i] != null) {
          humidity.push({ date: d.time[i], percent: d.relative_humidity_2m_mean[i] });
        }
        if (d.wind_speed_10m_max?.[i] != null) {
          windSpeed.push({ date: d.time[i], kmh: d.wind_speed_10m_max[i] });
        }
      }
    } else if (meteoResult.error) {
      errors.push(meteoResult.error);
    }

    // NASA POWER data
    if (nasaResult.data?.properties?.parameter) {
      sourcesUsed.push("NASA POWER");
      const params = nasaResult.data.properties.parameter;

      if (precipitation.length === 0 && params.PRECTOTCORR) {
        for (const [dateStr, val] of Object.entries(params.PRECTOTCORR)) {
          if (val >= 0) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            precipitation.push({ date: formatted, mm: val, source: "nasa-power" });
          }
        }
      }

      if (params.EVPTRNS) {
        for (const [dateStr, val] of Object.entries(params.EVPTRNS)) {
          if (val >= 0) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            evapotranspiration.push({ date: formatted, mm: val, source: "nasa-power" });
          }
        }
      }

      if (params.ALLSKY_SFC_SW_DWN) {
        for (const [dateStr, val] of Object.entries(params.ALLSKY_SFC_SW_DWN)) {
          if (val >= 0) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            solarRadiation.push({ date: formatted, kwh: val, source: "nasa-power" });
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
    const avgSoilMoisture = soilMoisture.length > 0 ? soilMoisture.reduce((s, v) => s + v.value, 0) / soilMoisture.length : 0;
    const totalSnowfallMm = snowfall.reduce((s, v) => s + v.mm, 0);
    const avgDischargeM3s = riverDischarge.length > 0 ? riverDischarge.reduce((s, v) => s + v.m3s, 0) / riverDischarge.length : 0;
    const totalEvapMm = evapotranspiration.filter(e => e.source === "open-meteo").reduce((s, v) => s + v.mm, 0);
    const avgTempC = temperature.length > 0 ? temperature.reduce((s, v) => s + v.celsius, 0) / temperature.length : 0;
    const avgHumidity = humidity.length > 0 ? humidity.reduce((s, v) => s + v.percent, 0) / humidity.length : 0;
    const avgWindSpeed = windSpeed.length > 0 ? windSpeed.reduce((s, v) => s + v.kmh, 0) / windSpeed.length : 0;
    const avgSolarRadiation = solarRadiation.length > 0 ? solarRadiation.reduce((s, v) => s + v.kwh, 0) / solarRadiation.length : 0;

    // Discharge anomaly: avg(actual/median) ratio
    const dischargeWithMedian = riverDischarge.filter(d => d.median && d.median > 0);
    const dischargeAnomalyRatio = dischargeWithMedian.length > 0
      ? dischargeWithMedian.reduce((s, d) => s + d.m3s / d.median!, 0) / dischargeWithMedian.length
      : 1.0;

    const r = (v: number) => Math.round(v * 10) / 10;

    const result = {
      success: true,
      data: {
        precipitation,
        evapotranspiration,
        soilMoisture,
        snowfall,
        riverDischarge,
        temperature,
        humidity,
        windSpeed,
        solarRadiation,
        summary: {
          totalPrecipMm: r(totalPrecipMm),
          avgSoilMoisture: Math.round(avgSoilMoisture * 1000) / 1000,
          totalSnowfallMm: r(totalSnowfallMm),
          avgDischargeM3s: r(avgDischargeM3s),
          totalEvapMm: r(totalEvapMm),
          avgTempC: r(avgTempC),
          avgHumidity: r(avgHumidity),
          avgWindSpeed: r(avgWindSpeed),
          avgSolarRadiation: r(avgSolarRadiation),
          dischargeAnomalyRatio: Math.round(dischargeAnomalyRatio * 100) / 100,
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
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
