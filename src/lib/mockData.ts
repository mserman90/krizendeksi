// Fırat-Dicle Weekly OSINT - Data Layer

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
  const weeklyIndex = weights.area * areaScore + weights.rain * rainScore + weights.news * newsScore;
  return { areaScore, rainScore, newsScore, weeklyIndex };
}

// ---- Hydro-based Crisis Index (real API data) ----

export interface HydroCrisisScores {
  precipScore: number;
  dischargeScore: number;
  dischargeAnomalyScore: number;
  soilMoistureScore: number;
  evapScore: number;
  snowScore: number;
  humidityScore: number;
  windScore: number;
  solarScore: number;
  weeklyIndex: number;
}

export interface HydroCrisisInput {
  totalPrecipMm: number;
  avgDischargeM3s: number;
  avgSoilMoisture: number;
  totalEvapMm: number;
  totalSnowfallMm: number;
  avgHumidity: number;
  avgWindSpeed: number;
  avgSolarRadiation: number;
  dischargeAnomalyRatio: number;
}

/**
 * Compute crisis index from real hydrological data.
 * Higher index = higher crisis risk.
 *
 * 9-component weighted formula:
 * - Discharge (absolute): 20% — less flow = more crisis (inverted)
 * - Discharge anomaly: 10% — ratio < 1 = below median = crisis (inverted)
 * - Precipitation: 18% — less rain = more crisis (inverted)
 * - Soil moisture: 14% — drier = more crisis (inverted)
 * - Evapotranspiration: 10% — more evap = more crisis
 * - Solar radiation: 8% — more radiation = more evaporation pressure
 * - Humidity: 8% — lower humidity = more evap = more crisis (inverted)
 * - Wind speed: 6% — more wind = more evaporation
 * - Snowfall: 6% — less snow = less future recharge (inverted)
 */
export function computeHydroCrisisIndex(input: HydroCrisisInput): HydroCrisisScores {
  const precipScore = normalize(input.totalPrecipMm, 0, 80, true);
  const dischargeScore = normalize(input.avgDischargeM3s, 200, 2000, true);
  const dischargeAnomalyScore = normalize(input.dischargeAnomalyRatio, 0.3, 1.5, true); // ratio < 1 means below median
  const soilMoistureScore = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const evapScore = normalize(input.totalEvapMm, 0, 70, false);
  const snowScore = normalize(input.totalSnowfallMm, 0, 50, true);
  const humidityScore = normalize(input.avgHumidity, 20, 90, true); // low humidity = more evap pressure
  const windScore = normalize(input.avgWindSpeed, 0, 60, false); // high wind = more evap
  const solarScore = normalize(input.avgSolarRadiation, 1, 8, false); // high radiation = evap pressure (kWh/m²/day)

  const weeklyIndex =
    0.18 * precipScore +
    0.20 * dischargeScore +
    0.10 * dischargeAnomalyScore +
    0.14 * soilMoistureScore +
    0.10 * evapScore +
    0.08 * solarScore +
    0.08 * humidityScore +
    0.06 * windScore +
    0.06 * snowScore;

  return {
    precipScore, dischargeScore, dischargeAnomalyScore,
    soilMoistureScore, evapScore, snowScore,
    humidityScore, windScore, solarScore, weeklyIndex,
  };
}

// ---- NATO CCSIA-Based Vulnerability Index ----

/**
 * NATO Climate Change and Security Impact Assessment (CCSIA) inspired
 * 6-pillar vulnerability index.
 *
 * Based on NATO's Climate Change and Security Action Plan (2021),
 * NATO CCSIA Third Edition (2024), and STO-TR-SAS-182 methodology.
 *
 * NATO treats climate change as a "threat multiplier" across resilience
 * pillars. This index maps hydrological data to NATO's security framework:
 *
 * 1. Water Scarcity Stress (25%) — Food/water resilience baseline
 * 2. Hydrological Anomaly (20%) — Threat assessment: deviation from normal
 * 3. Evaporative Demand Pressure (15%) — Environmental stress cascading
 * 4. Critical Infrastructure Risk (15%) — Civil transport & energy resilience
 * 5. Agricultural & Food Security (15%) — Food security, livelihood disruption
 * 6. Cascading Instability Potential (10%) — Threat multiplier / displacement risk
 */

export interface NatoCrisisScores {
  waterScarcityScore: number;       // Pillar 1
  hydrologicalAnomalyScore: number; // Pillar 2
  evaporativeDemandScore: number;   // Pillar 3
  infrastructureRiskScore: number;  // Pillar 4
  foodSecurityScore: number;        // Pillar 5
  cascadingInstabilityScore: number; // Pillar 6
  weeklyIndex: number;
}

export function computeNatoCrisisIndex(input: HydroCrisisInput): NatoCrisisScores {
  // Pillar 1: Water Scarcity Stress (25%)
  // Combines precipitation deficit and discharge — NATO's core "food and water resources" baseline
  const precipDeficit = normalize(input.totalPrecipMm, 0, 80, true);
  const dischargeDeficit = normalize(input.avgDischargeM3s, 200, 2000, true);
  const waterScarcityScore = 0.55 * precipDeficit + 0.45 * dischargeDeficit;

  // Pillar 2: Hydrological Anomaly (20%)
  // NATO emphasizes deviation from historical norms as threat indicator
  // Combines discharge anomaly ratio with soil moisture departure
  const anomalyRatio = normalize(input.dischargeAnomalyRatio, 0.3, 1.5, true);
  const soilDeparture = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const hydrologicalAnomalyScore = 0.6 * anomalyRatio + 0.4 * soilDeparture;

  // Pillar 3: Evaporative Demand Pressure (15%)
  // NATO CCSIA highlights cascading environmental stress — heat + evap + wind
  const evap = normalize(input.totalEvapMm, 0, 70, false);
  const solar = normalize(input.avgSolarRadiation, 1, 8, false);
  const wind = normalize(input.avgWindSpeed, 0, 60, false);
  const evaporativeDemandScore = 0.45 * evap + 0.30 * solar + 0.25 * wind;

  // Pillar 4: Critical Infrastructure Risk (15%)
  // NATO resilience baseline: extreme flow conditions threaten civil transport,
  // energy (hydropower), and infrastructure
  // Both very low and very high discharge are risky
  const lowFlowRisk = normalize(input.avgDischargeM3s, 200, 800, true);
  const humidityStress = normalize(input.avgHumidity, 20, 90, true);
  const infrastructureRiskScore = 0.6 * lowFlowRisk + 0.4 * humidityStress;

  // Pillar 5: Agricultural & Food Security (15%)
  // NATO CCSIA: food security directly linked to soil moisture, precipitation, snow recharge
  const soilDry = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const snowRecharge = normalize(input.totalSnowfallMm, 0, 50, true);
  const rainDeficit = normalize(input.totalPrecipMm, 0, 80, true);
  const foodSecurityScore = 0.40 * soilDry + 0.35 * rainDeficit + 0.25 * snowRecharge;

  // Pillar 6: Cascading Instability Potential (10%)
  // NATO's "threat multiplier" concept: when multiple stressors align,
  // risk of displacement, conflict and cascading failure rises non-linearly
  const stressors = [precipDeficit, dischargeDeficit, anomalyRatio, soilDeparture, evap];
  const highStressCount = stressors.filter(s => s > 65).length;
  const avgStress = stressors.reduce((a, b) => a + b, 0) / stressors.length;
  // Non-linear amplification when multiple pillars are stressed
  const amplifier = 1 + (highStressCount / stressors.length) * 0.4;
  const cascadingInstabilityScore = Math.min(100, avgStress * amplifier);

  const weeklyIndex =
    0.25 * waterScarcityScore +
    0.20 * hydrologicalAnomalyScore +
    0.15 * evaporativeDemandScore +
    0.15 * infrastructureRiskScore +
    0.15 * foodSecurityScore +
    0.10 * cascadingInstabilityScore;

  return {
    waterScarcityScore,
    hydrologicalAnomalyScore,
    evaporativeDemandScore,
    infrastructureRiskScore,
    foodSecurityScore,
    cascadingInstabilityScore,
    weeklyIndex,
  };
}

// ---------- Mock Data Generation ----------

function getWeekDate(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - weeksAgo * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWeeklyTimeSeries(weeks = 12): WeeklyData[] {
  const data: WeeklyData[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const { start, end } = getWeekDate(i);
    const monthIndex = new Date(end).getMonth();
    const seasonFactor = Math.cos(((monthIndex - 1) / 12) * 2 * Math.PI);
    const baseArea = 500 + seasonFactor * 150;
    const area = baseArea + (seededRandom(i * 31 + 7) - 0.5) * 120;
    const baseRain = 30 + seasonFactor * 25;
    const rain = Math.max(0, baseRain + (seededRandom(i * 17 + 3) - 0.5) * 40);
    const newsCount = Math.floor(3 + seededRandom(i * 43 + 11) * 18);
    const metrics: WeeklyMetrics = {
      weekStart: start, weekEnd: end,
      reservoirAreaKm2: Math.round(area * 10) / 10,
      basinRainMm: Math.round(rain * 10) / 10,
    };
    const scores = computeWeeklyCrisisIndex(metrics.reservoirAreaKm2, metrics.basinRainMm, newsCount);
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
    return { title: h.title, link: "#", description: h.desc, pubDate: d.toISOString().slice(0, 10), source: h.source };
  });
}

export function getCrisisLevel(index: number): { label: string; color: string } {
  if (index < 25) return { label: "Düşük", color: "hsl(var(--crisis-low))" };
  if (index < 50) return { label: "Orta", color: "hsl(var(--crisis-medium))" };
  if (index < 75) return { label: "Yüksek", color: "hsl(var(--crisis-high))" };
  return { label: "Kritik", color: "hsl(var(--crisis-critical))" };
}
