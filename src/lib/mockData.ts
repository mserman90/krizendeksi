// Fırat-Dicle Weekly OSINT - Data Layer
// Translated from Python: normalize() + compute_weekly_crisis_index()

export interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  reservoirAreaKm2: number;
  basinRainMm: number;
}

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

export interface CrisisScores {
  areaScore: number;
  rainScore: number;
  newsScore: number;
  weeklyIndex: number;
}

export interface WeeklyData {
  metrics: WeeklyMetrics;
  scores: CrisisScores;
  newsCount: number;
}

// Direct translation of Python normalize()
export function normalize(
  value: number | null,
  minVal: number,
  maxVal: number,
  invert = false
): number {
  if (value === null) return 50.0;
  if (maxVal === minVal) return 50.0;
  let ratio = (value - minVal) / (maxVal - minVal);
  ratio = Math.max(0.0, Math.min(1.0, ratio));
  if (invert) ratio = 1.0 - ratio;
  return ratio * 100.0;
}

// Direct translation of Python compute_weekly_crisis_index()
export function computeWeeklyCrisisIndex(
  reservoirAreaKm2: number | null,
  basinRainMm: number | null,
  newsCount: number,
  histAreaRange: [number, number] = [100.0, 900.0],
  histRainRange: [number, number] = [0.0, 100.0]
): CrisisScores {
  const areaScore = normalize(reservoirAreaKm2, histAreaRange[0], histAreaRange[1], true);
  const rainScore = normalize(basinRainMm, histRainRange[0], histRainRange[1], true);
  const newsScore = normalize(Math.min(newsCount, 50), 0, 50, false);

  const weights = { area: 0.4, rain: 0.3, news: 0.3 };
  const weeklyIndex =
    weights.area * areaScore +
    weights.rain * rainScore +
    weights.news * newsScore;

  return { areaScore, rainScore, newsScore, weeklyIndex };
}

// ---- Hydro-based Crisis Index (real API data) ----

export interface HydroCrisisScores {
  precipScore: number;
  dischargeScore: number;
  soilMoistureScore: number;
  evapScore: number;
  snowScore: number;
  weeklyIndex: number;
}

export interface HydroCrisisInput {
  totalPrecipMm: number;
  avgDischargeM3s: number;
  avgSoilMoisture: number;
  totalEvapMm: number;
  totalSnowfallMm: number;
}

/**
 * Compute crisis index from real hydrological data.
 * Higher index = higher crisis risk.
 *
 * Historical reference ranges for Fırat-Dicle basin (14-day):
 * - Precipitation: 0–80 mm (inverted: less rain = more crisis)
 * - Discharge: 200–2000 m³/s (inverted: less flow = more crisis)
 * - Soil moisture: 0.05–0.45 m³/m³ (inverted: drier = more crisis)
 * - Evapotranspiration: 0–70 mm (not inverted: more evap = more crisis)
 * - Snowfall: 0–50 mm (inverted: less snow = less future recharge)
 */
export function computeHydroCrisisIndex(input: HydroCrisisInput): HydroCrisisScores {
  const precipScore = normalize(input.totalPrecipMm, 0, 80, true);
  const dischargeScore = normalize(input.avgDischargeM3s, 200, 2000, true);
  const soilMoistureScore = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const evapScore = normalize(input.totalEvapMm, 0, 70, false);
  const snowScore = normalize(input.totalSnowfallMm, 0, 50, true);

  const weights = {
    precip: 0.25,
    discharge: 0.30,
    soilMoisture: 0.20,
    evap: 0.15,
    snow: 0.10,
  };

  const weeklyIndex =
    weights.precip * precipScore +
    weights.discharge * dischargeScore +
    weights.soilMoisture * soilMoistureScore +
    weights.evap * evapScore +
    weights.snow * snowScore;

  return { precipScore, dischargeScore, soilMoistureScore, evapScore, snowScore, weeklyIndex };
}

// ---------- Mock Data Generation ----------

function getWeekDate(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - weeksAgo * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWeeklyTimeSeries(weeks = 12): WeeklyData[] {
  const data: WeeklyData[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const { start, end } = getWeekDate(i);
    // Seasonal variation: summer = lower area, winter = higher
    const monthIndex = new Date(end).getMonth();
    const seasonFactor = Math.cos(((monthIndex - 1) / 12) * 2 * Math.PI);

    const baseArea = 500 + seasonFactor * 150;
    const area = baseArea + (seededRandom(i * 31 + 7) - 0.5) * 120;

    const baseRain = 30 + seasonFactor * 25;
    const rain = Math.max(0, baseRain + (seededRandom(i * 17 + 3) - 0.5) * 40);

    const newsCount = Math.floor(3 + seededRandom(i * 43 + 11) * 18);

    const metrics: WeeklyMetrics = {
      weekStart: start,
      weekEnd: end,
      reservoirAreaKm2: Math.round(area * 10) / 10,
      basinRainMm: Math.round(rain * 10) / 10,
    };

    const scores = computeWeeklyCrisisIndex(
      metrics.reservoirAreaKm2,
      metrics.basinRainMm,
      newsCount
    );

    data.push({ metrics, scores, newsCount });
  }

  return data;
}

export function generateMockNews(): NewsItem[] {
  const headlines: Array<{ title: string; desc: string; source: string }> = [
    { title: "Atatürk Barajı su seviyesi mevsim normallerinin altında", desc: "DSİ verilerine göre Atatürk Barajı'nda su seviyesi geçen yıla göre %12 düşük.", source: "AA" },
    { title: "Fırat Nehri akış debisi azalıyor", desc: "Birecik istasyonunda ölçülen debi 350 m³/s seviyesine geriledi.", source: "TRT" },
    { title: "Dicle Havzası'nda kuraklık uyarısı", desc: "Meteoroloji Genel Müdürlüğü bölgede ciddi kuraklık riski olduğunu açıkladı.", source: "NTV" },
    { title: "Güneydoğu'da tarımsal sulama krizi derinleşiyor", desc: "Çiftçiler su kesintileri nedeniyle ekim yapamıyor.", source: "Hürriyet" },
    { title: "Irak, Türkiye'den daha fazla su bırakmasını talep etti", desc: "Irak Dışişleri Bakanlığı diplomatik nota gönderdi.", source: "Reuters" },
    { title: "Euphrates water levels hit seasonal low", desc: "Satellite imagery confirms reduced surface area across major reservoirs.", source: "Al Jazeera" },
    { title: "Dicle Nehri'nde taşkın riski azaldı", desc: "Son haftalarda yaşanan kurak hava taşkın riskini düşürdü.", source: "AA" },
    { title: "Fırat-Dicle havzasında yeni sulama projesi", desc: "DSİ bölgede verimli sulama altyapısı çalışması başlattı.", source: "Sabah" },
    { title: "Baraj doluluk oranları haftalık raporu yayınlandı", desc: "Keban, Karakaya ve Atatürk barajlarının doluluk oranları açıklandı.", source: "DSİ" },
    { title: "Tigris basin rainfall below average this month", desc: "CHIRPS data shows 40% less precipitation compared to historical mean.", source: "NASA Earth" },
    { title: "GAP bölgesinde su tasarrufu kampanyası", desc: "Yerel yönetimler su tasarrufu için farkındalık kampanyası başlattı.", source: "TRT" },
    { title: "Suriye'de Fırat üzerindeki barajlarda elektrik üretimi düştü", desc: "Tabqa barajında üretim %30 azaldı.", source: "BBC" },
  ];

  const now = new Date();
  return headlines.map((h, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return {
      title: h.title,
      link: "#",
      description: h.desc,
      pubDate: d.toISOString().slice(0, 10),
      source: h.source,
    };
  });
}

export function getCrisisLevel(index: number): { label: string; color: string } {
  if (index < 25) return { label: "Düşük", color: "hsl(var(--crisis-low))" };
  if (index < 50) return { label: "Orta", color: "hsl(var(--crisis-medium))" };
  if (index < 75) return { label: "Yüksek", color: "hsl(var(--crisis-high))" };
  return { label: "Kritik", color: "hsl(var(--crisis-critical))" };
}
