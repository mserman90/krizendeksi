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

// ---- NATO 360° Security / 7 Baseline Requirements (7BLR) Vulnerability Index ----

/**
 * NATO "360-degree security" concept and 7 Baseline Requirements for
 * National Resilience (7BLR) standards-based Allied Risk Score.
 *
 * S_Allied = (CCSRT × 0.25) + (PACA × 0.25) + (RSI × 0.20) + (BlackStart × 0.20) + (Kinetic × 0.10)
 *
 * References:
 * - NATO CCSIA Third Edition (2024)
 * - NATO Climate Change Action Plan (2021)
 * - STO-TR-SAS-182
 * - NATO 7 Baseline Requirements for National Resilience
 *
 * Five sub-indices mapped to hydrological/meteorological data:
 *
 * 1. CCSRT — Climate Change Security Risk Threshold (25%)
 *    Integrated climate-water stress crossing critical security thresholds.
 *    7BLR mapping: Food & Water Supply, Energy Supply
 *
 * 2. PACA — Predictive Adaptive Capacity Assessment (25%)
 *    System's ability to absorb shocks — deviation from norms signals low adaptive capacity.
 *    7BLR mapping: Resilient Civil Communications, Continuity of Government
 *
 * 3. RSI — Resource Scarcity Index (20%)
 *    Multi-resource depletion indicator — soil, snow reserves, precipitation deficit.
 *    7BLR mapping: Food & Water Supply, Resilient Energy Supply
 *
 * 4. BlackStart — Critical Infrastructure Failure Potential (20%)
 *    Risk of cascading infrastructure failure under compound environmental stress.
 *    7BLR mapping: Civil Transport, Energy Supply, Mass Casualty Management
 *
 * 5. Kinetic — Conflict & Displacement Trigger Potential (10%)
 *    Non-linear amplification when multiple stressors exceed thresholds simultaneously.
 *    7BLR mapping: Uncontrolled Movement of People, Continuity of Government
 */

export interface NatoCrisisScores {
  ccsrtScore: number;      // Climate Change Security Risk Threshold
  pacaScore: number;       // Predictive Adaptive Capacity Assessment
  rsiScore: number;        // Resource Scarcity Index
  blackStartScore: number; // Critical Infrastructure Failure Potential
  kineticScore: number;    // Conflict & Displacement Trigger
  weeklyIndex: number;     // S_Allied
}

export function computeNatoCrisisIndex(input: HydroCrisisInput): NatoCrisisScores {
  // === CCSRT — Climate Change Security Risk Threshold (25%) ===
  // Crosses when water availability falls below security-critical levels
  // Combines: precipitation deficit, discharge deficit, evapotranspiration pressure
  const precipDeficit = normalize(input.totalPrecipMm, 0, 80, true);
  const dischargeDeficit = normalize(input.avgDischargeM3s, 200, 2000, true);
  const evapPressure = normalize(input.totalEvapMm, 0, 70, false);
  const ccsrtScore = 0.40 * precipDeficit + 0.35 * dischargeDeficit + 0.25 * evapPressure;

  // === PACA — Predictive Adaptive Capacity Assessment (25%) ===
  // How far current conditions deviate from historical baselines
  // Large deviations = system operating outside adaptive envelope
  const anomalyRatio = normalize(input.dischargeAnomalyRatio, 0.3, 1.5, true);
  const soilDeparture = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const humidityDeparture = normalize(input.avgHumidity, 20, 90, true);
  // Variance-based: higher variance across indicators = lower adaptive capacity
  const pacaIndicators = [anomalyRatio, soilDeparture, humidityDeparture];
  const pacaMean = pacaIndicators.reduce((a, b) => a + b, 0) / pacaIndicators.length;
  const pacaVariance = pacaIndicators.reduce((sum, v) => sum + Math.pow(v - pacaMean, 2), 0) / pacaIndicators.length;
  // Weighted combination of mean stress + variance amplification
  const pacaScore = Math.min(100, pacaMean * (1 + Math.sqrt(pacaVariance) / 100));

  // === RSI — Resource Scarcity Index (20%) ===
  // Multi-dimensional resource depletion across water, soil, and snow reserves
  const soilDry = normalize(input.avgSoilMoisture, 0.05, 0.45, true);
  const snowReserve = normalize(input.totalSnowfallMm, 0, 50, true);
  const rainDeficit = normalize(input.totalPrecipMm, 0, 80, true);
  const windDrying = normalize(input.avgWindSpeed, 0, 60, false);
  const rsiScore = 0.30 * soilDry + 0.30 * rainDeficit + 0.25 * snowReserve + 0.15 * windDrying;

  // === BlackStart — Critical Infrastructure Failure Potential (20%) ===
  // Risk of cascading failure: hydropower, irrigation, civil transport
  // Named after NATO grid resilience concept — can systems "black start" after failure?
  const lowFlowRisk = normalize(input.avgDischargeM3s, 200, 800, true);
  const solarLoad = normalize(input.avgSolarRadiation, 1, 8, false);
  const evapDemand = normalize(input.totalEvapMm, 0, 70, false);
  // Compound stress: when multiple infrastructure-critical factors align
  const infraStressors = [lowFlowRisk, solarLoad, evapDemand];
  const infraAbove60 = infraStressors.filter(s => s > 60).length;
  const infraMean = infraStressors.reduce((a, b) => a + b, 0) / infraStressors.length;
  // Step function: compound risk escalates when 2+ factors are stressed
  const compoundMultiplier = infraAbove60 >= 2 ? 1.15 : 1.0;
  const blackStartScore = Math.min(100, infraMean * compoundMultiplier);

  // === Kinetic — Conflict & Displacement Trigger Potential (10%) ===
  // Non-linear "threat multiplier": when ALL pillars are stressed, displacement/conflict risk spikes
  const allScores = [ccsrtScore, pacaScore, rsiScore, blackStartScore];
  const allMean = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const highStressCount = allScores.filter(s => s > 65).length;
  // Exponential amplification based on concurrent stress count
  const kineticAmplifier = 1 + Math.pow(highStressCount / allScores.length, 1.5) * 0.5;
  const kineticScore = Math.min(100, allMean * kineticAmplifier);

  // === S_Allied — Weighted Allied Risk Score ===
  const weeklyIndex =
    0.25 * ccsrtScore +
    0.25 * pacaScore +
    0.20 * rsiScore +
    0.20 * blackStartScore +
    0.10 * kineticScore;

  return {
    ccsrtScore,
    pacaScore,
    rsiScore,
    blackStartScore,
    kineticScore,
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
