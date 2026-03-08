import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BASIN_CONFIGS: Record<string, { name: string; center: { lat: number; lon: number }; floodPoints: { lat: number; lon: number; name: string }[] }> = {
  "firat-dicle": { name: "Fırat-Dicle", center: { lat: 37.8, lon: 39.5 }, floodPoints: [{ lat: 37.47, lon: 38.33, name: "Atatürk" }, { lat: 36.85, lon: 40.42, name: "Dicle-Hasankeyf" }] },
  "meric-ergene": { name: "Meriç-Ergene", center: { lat: 41.7, lon: 26.3 }, floodPoints: [{ lat: 41.67, lon: 26.56, name: "Edirne" }, { lat: 41.40, lon: 26.72, name: "Meriç-İpsala" }] },
  "coruh": { name: "Çoruh", center: { lat: 40.9, lon: 41.2 }, floodPoints: [{ lat: 41.18, lon: 41.82, name: "Çoruh-Batum" }, { lat: 40.85, lon: 41.50, name: "Artvin" }] },
  "aras": { name: "Aras", center: { lat: 40.0, lon: 43.5 }, floodPoints: [{ lat: 39.92, lon: 44.58, name: "Aras-Iğdır" }, { lat: 40.17, lon: 43.67, name: "Aras-Kars" }] },
  "kura": { name: "Kura", center: { lat: 41.2, lon: 43.0 }, floodPoints: [{ lat: 41.23, lon: 43.60, name: "Kura-Ardahan" }] },
};

function normalize(value: number, min: number, max: number, invert = false): number {
  if (max === min) return 50;
  let ratio = (value - min) / (max - min);
  ratio = Math.max(0, Math.min(1, ratio));
  if (invert) ratio = 1 - ratio;
  return ratio * 100;
}

function computeCrisisIndex(s: any): number {
  const precipScore = normalize(s.totalPrecipMm, 0, 80, true);
  const dischargeScore = normalize(s.avgDischargeM3s, 200, 2000, true);
  const dischargeAnomalyScore = normalize(s.dischargeAnomalyRatio, 0.3, 1.5, true);
  const soilMoistureScore = normalize(s.avgSoilMoisture, 0.05, 0.45, true);
  const evapScore = normalize(s.totalEvapMm, 0, 70, false);
  const snowScore = normalize(s.totalSnowfallMm, 0, 50, true);
  const humidityScore = normalize(s.avgHumidity, 20, 90, true);
  const windScore = normalize(s.avgWindSpeed, 0, 60, false);
  const solarScore = normalize(s.avgSolarRadiation, 1, 8, false);

  return 0.18 * precipScore + 0.20 * dischargeScore + 0.10 * dischargeAnomalyScore +
    0.14 * soilMoistureScore + 0.10 * evapScore + 0.08 * solarScore +
    0.08 * humidityScore + 0.06 * windScore + 0.06 * snowScore;
}

function getCrisisLevel(index: number): { label: string; color: string } {
  if (index >= 80) return { label: "🔴 KRİTİK", color: "#dc2626" };
  if (index >= 60) return { label: "🟠 YÜKSEK", color: "#ea580c" };
  if (index >= 40) return { label: "🟡 ORTA", color: "#ca8a04" };
  if (index >= 20) return { label: "🟢 DÜŞÜK", color: "#16a34a" };
  return { label: "🔵 MİNİMAL", color: "#2563eb" };
}

async function fetchHydroSummary(basinId: string): Promise<any> {
  const basin = BASIN_CONFIGS[basinId];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${basin.center.lat}&longitude=${basin.center.lon}&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_mean,soil_moisture_0_to_7cm_mean,snowfall_sum,relative_humidity_2m_mean,wind_speed_10m_max&past_days=14&forecast_days=1&timezone=auto`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo HTTP ${resp.status}`);
  const data = await resp.json();
  const d = data.daily;

  const sum = (arr: number[]) => arr.reduce((s, v) => s + (v ?? 0), 0);
  const avg = (arr: number[]) => { const valid = arr.filter(v => v != null); return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : 0; };

  // Fetch flood data for discharge
  let avgDischargeM3s = 0;
  let dischargeAnomalyRatio = 1;
  try {
    const floodResults = await Promise.all(basin.floodPoints.map(async (p) => {
      const fUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${p.lat}&longitude=${p.lon}&daily=river_discharge,river_discharge_median&past_days=14&forecast_days=1`;
      const fResp = await fetch(fUrl);
      if (!fResp.ok) return null;
      return await fResp.json();
    }));

    const allDischarges: { val: number; median: number }[] = [];
    for (const fr of floodResults) {
      if (!fr?.daily) continue;
      for (let i = 0; i < fr.daily.time.length; i++) {
        if (fr.daily.river_discharge?.[i] != null) {
          allDischarges.push({ val: fr.daily.river_discharge[i], median: fr.daily.river_discharge_median?.[i] ?? fr.daily.river_discharge[i] });
        }
      }
    }
    if (allDischarges.length > 0) {
      avgDischargeM3s = allDischarges.reduce((s, d) => s + d.val, 0) / allDischarges.length;
      const withMedian = allDischarges.filter(d => d.median > 0);
      dischargeAnomalyRatio = withMedian.length > 0 ? withMedian.reduce((s, d) => s + d.val / d.median, 0) / withMedian.length : 1;
    }
  } catch { /* ignore flood errors */ }

  return {
    totalPrecipMm: Math.round(sum(d.precipitation_sum) * 10) / 10,
    avgDischargeM3s: Math.round(avgDischargeM3s * 10) / 10,
    avgSoilMoisture: d.soil_moisture_0_to_7cm_mean ? Math.round(avg(d.soil_moisture_0_to_7cm_mean) * 1000) / 1000 : 0,
    totalEvapMm: Math.round(sum(d.et0_fao_evapotranspiration) * 10) / 10,
    totalSnowfallMm: Math.round(sum(d.snowfall_sum) * 10) / 10,
    avgHumidity: Math.round(avg(d.relative_humidity_2m_mean) * 10) / 10,
    avgWindSpeed: Math.round(avg(d.wind_speed_10m_max) * 10) / 10,
    avgSolarRadiation: 0,
    avgTempC: Math.round(avg(d.temperature_2m_mean) * 10) / 10,
    dischargeAnomalyRatio: Math.round(dischargeAnomalyRatio * 100) / 100,
  };
}

function buildEmailHtml(basinResults: { basinId: string; name: string; index: number; level: { label: string; color: string }; summary: any }[], type: "daily" | "alert") {
  const date = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
  const title = type === "daily" ? `Günlük Kriz Raporu — ${date}` : `⚠️ KRİZ ALARMI — ${date}`;

  const basinRows = basinResults.map(b => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600">${b.name}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="background:${b.level.color};color:#fff;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${Math.round(b.index)}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center">${b.level.label}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${b.summary.totalPrecipMm} mm</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${b.summary.avgDischargeM3s} m³/s</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${b.summary.avgHumidity}%</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:680px;margin:0 auto;padding:24px">
    <div style="background:#1e293b;color:#fff;padding:24px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:20px">${title}</h1>
      <p style="margin:6px 0 0;opacity:0.8;font-size:13px">Sınıraşan Su Havzaları OSINT İzleme Sistemi</p>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px;text-align:left;border-bottom:2px solid #e5e7eb">Havza</th>
            <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb">Endeks</th>
            <th style="padding:10px;text-align:center;border-bottom:2px solid #e5e7eb">Seviye</th>
            <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb">Yağış</th>
            <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb">Debi</th>
            <th style="padding:10px;text-align:right;border-bottom:2px solid #e5e7eb">Nem</th>
          </tr>
        </thead>
        <tbody>${basinRows}</tbody>
      </table>
      <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;text-align:center">
        Bu rapor otomatik olarak oluşturulmuştur. Veriler Open-Meteo ve GloFAS kaynaklarından alınmaktadır.
      </p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    let type: "daily" | "alert" = "daily";
    let alertThreshold = 60;
    let recipient = "serdarerman@gmail.com";

    try {
      const body = await req.json();
      if (body?.type) type = body.type;
      if (body?.threshold) alertThreshold = body.threshold;
      if (body?.recipient) recipient = body.recipient;
    } catch { /* no body for cron calls */ }

    // Fetch all basin data
    const basinIds = Object.keys(BASIN_CONFIGS);
    const basinResults = await Promise.all(basinIds.map(async (basinId) => {
      const summary = await fetchHydroSummary(basinId);
      const index = computeCrisisIndex(summary);
      return {
        basinId,
        name: BASIN_CONFIGS[basinId].name,
        index,
        level: getCrisisLevel(index),
        summary,
      };
    }));

    // For alert type, only send if any basin exceeds threshold
    if (type === "alert") {
      const alertBasins = basinResults.filter(b => b.index >= alertThreshold);
      if (alertBasins.length === 0) {
        return new Response(JSON.stringify({ success: true, sent: false, message: "No basins above threshold" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const subject = type === "daily"
      ? `📊 Günlük Kriz Raporu — ${new Date().toLocaleDateString("tr-TR")}`
      : `⚠️ KRİZ ALARMI — ${basinResults.filter(b => b.index >= alertThreshold).map(b => b.name).join(", ")}`;

    const html = buildEmailHtml(basinResults, type);

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kriz Endeksi <onboarding@resend.dev>",
        to: [recipient],
        subject,
        html,
      }),
    });

    const emailData = await emailResp.json();

    if (!emailResp.ok) {
      throw new Error(`Resend API error [${emailResp.status}]: ${JSON.stringify(emailData)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      sent: true,
      emailId: emailData.id,
      basinCount: basinResults.length,
      maxCrisis: Math.round(Math.max(...basinResults.map(b => b.index))),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
