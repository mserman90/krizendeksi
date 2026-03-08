import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateWeeklyTimeSeries, generateMockNews, getCrisisLevel, computeHydroCrisisIndex } from "@/lib/mockData";
import type { NewsItem, HydroCrisisScores } from "@/lib/mockData";
import { fetchRssNews } from "@/lib/api/rssApi";
import CrisisGauge from "@/components/CrisisGauge";
import ReservoirChart from "@/components/ReservoirChart";
import RainfallChart from "@/components/RainfallChart";
import NewsPanel from "@/components/NewsPanel";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import HydroCrisisBreakdown from "@/components/HydroCrisisBreakdown";
import BasinInfo from "@/components/BasinInfo";
import BasinMap from "@/components/BasinMap";
import HydroPanel from "@/components/HydroPanel";
import CrisisAlertBanner from "@/components/CrisisAlertBanner";
import CrisisAlertHistory from "@/components/CrisisAlertHistory";
import ThemeToggle from "@/components/ThemeToggle";
import { useHydroData } from "@/hooks/useHydroData";
import { useCrisisAlerts } from "@/hooks/useCrisisAlerts";
import { Activity, Droplets, CloudRain, Newspaper, Map, Database, Zap, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const timeSeries = useMemo(() => generateWeeklyTimeSeries(12), []);
  const mockNews = useMemo(() => generateMockNews(), []);
  const latest = timeSeries[timeSeries.length - 1];
  const hydro = useHydroData();
  const { alerts, loading: alertsLoading } = useCrisisAlerts();

  // Auto-fetch hydro data on mount
  useEffect(() => {
    hydro.fetch(14);
  }, []);

  // Compute hydro-based crisis scores when data is available
  const hydroCrisis: HydroCrisisScores | null = useMemo(() => {
    if (!hydro.data?.summary) return null;
    const s = hydro.data.summary;
    return computeHydroCrisisIndex({
      totalPrecipMm: s.totalPrecipMm,
      avgDischargeM3s: s.avgDischargeM3s,
      avgSoilMoisture: s.avgSoilMoisture,
      totalEvapMm: s.totalEvapMm,
      totalSnowfallMm: s.totalSnowfallMm,
      avgHumidity: s.avgHumidity,
      avgWindSpeed: s.avgWindSpeed,
      avgSolarRadiation: s.avgSolarRadiation,
      dischargeAnomalyRatio: s.dischargeAnomalyRatio,
    });
  }, [hydro.data]);

  // Use hydro crisis index if available, otherwise fall back to mock
  const crisisValue = hydroCrisis?.weeklyIndex ?? latest.scores.weeklyIndex;
  const { label } = getCrisisLevel(crisisValue);
  const isHydroLive = hydroCrisis !== null;
  const [alertThreshold, setAlertThreshold] = useState(60);

  const [liveNews, setLiveNews] = useState<NewsItem[] | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsFilter, setNewsFilter] = useState(true);

  const handleFetchNews = useCallback(async (filter: boolean) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetchRssNews(filter);
      if (res.success && res.items) {
        setLiveNews(res.items);
        if (res.errors?.length) {
          setNewsError(`Bazı kaynaklar yüklenemedi: ${res.errors.join(", ")}`);
        }
      } else {
        setNewsError(res.error || "Haberler alınamadı");
      }
    } catch (e) {
      setNewsError("Bağlantı hatası");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const newsItems = liveNews ?? mockNews;
  const isLive = liveNews !== null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Fırat-Dicle Haftalık OSINT İzleme Paneli</h1>
              <p className="text-xs text-muted-foreground">
                {hydro.data?.summary
                  ? `${hydro.data.summary.periodStart} — ${hydro.data.summary.periodEnd}`
                  : `${latest.metrics.weekStart} — ${latest.metrics.weekEnd}`}
                {" · Durum: "}{label}
              </p>
              {isHydroLive && (
                <Badge variant="outline" className="text-[10px] mt-1 border-green-500 text-green-600">
                  <Zap className="h-3 w-3 mr-1" /> Canlı Hidrolojik Veri
                </Badge>
              )}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Alert Banner */}
        <CrisisAlertBanner crisisIndex={crisisValue} threshold={alertThreshold} />

        {/* Row 1: Crisis Gauge + Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Kriz Endeksi
                {isHydroLive && <Badge variant="secondary" className="text-[10px]">Canlı</Badge>}
                {hydro.loading && <span className="text-[10px] text-muted-foreground animate-pulse">Yükleniyor...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CrisisGauge value={crisisValue} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4" /> {isHydroLive ? "Toplam Yağış" : "Rezervuar Alanı"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isHydroLive ? (
                <>
                  <p className="text-3xl font-bold font-mono">{hydro.data!.summary.totalPrecipMm}</p>
                  <p className="text-xs text-muted-foreground">mm (havza toplam, {hydro.data!.summary.periodStart} – {hydro.data!.summary.periodEnd})</p>
                  <p className="text-xs mt-2">
                    Skor: <span className="font-mono font-semibold">{Math.round(hydroCrisis!.precipScore)}</span>/100
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold font-mono">{latest.metrics.reservoirAreaKm2}</p>
                  <p className="text-xs text-muted-foreground">km² (Atatürk Barajı)</p>
                  <p className="text-xs mt-2">
                    Skor: <span className="font-mono font-semibold">{Math.round(latest.scores.areaScore)}</span>/100
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CloudRain className="h-4 w-4" /> {isHydroLive ? "Ort. Nehir Debisi" : "Haftalık Yağış"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isHydroLive ? (
                <>
                  <p className="text-3xl font-bold font-mono">{hydro.data!.summary.avgDischargeM3s}</p>
                  <p className="text-xs text-muted-foreground">m³/s (havza ortalaması)</p>
                  <p className="text-xs mt-2">
                    Skor: <span className="font-mono font-semibold">{Math.round(hydroCrisis!.dischargeScore)}</span>/100
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold font-mono">{latest.metrics.basinRainMm}</p>
                  <p className="text-xs text-muted-foreground">mm (havza ortalaması)</p>
                  <p className="text-xs mt-2">
                    Skor: <span className="font-mono font-semibold">{Math.round(latest.scores.rainScore)}</span>/100
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Reservoir Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rezervuar Su Alanı (Son 12 Hafta)</CardTitle>
          </CardHeader>
          <CardContent>
            <ReservoirChart data={timeSeries} />
          </CardContent>
        </Card>

        {/* Row 3: Rainfall + News */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Haftalık Yağış (mm)</CardTitle>
            </CardHeader>
            <CardContent>
              <RainfallChart data={timeSeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Newspaper className="h-4 w-4" /> İlgili Haberler ({newsItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewsPanel
                items={newsItems}
                isLive={isLive}
                isLoading={newsLoading}
                onRefresh={handleFetchNews}
                error={newsError}
                filterEnabled={newsFilter}
                onFilterChange={setNewsFilter}
              />
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Basin Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="h-4 w-4" /> Fırat-Dicle Havzası Haritası
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BasinMap />
          </CardContent>
        </Card>

        {/* Row 5: Hydro Data Panel (Real API Data) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" /> Hidrolojik Veriler (Open-Meteo · NASA POWER · GloFAS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HydroPanel
              data={hydro.data}
              loading={hydro.loading}
              error={hydro.error}
              warnings={hydro.warnings}
              onFetch={hydro.fetch}
            />
          </CardContent>
        </Card>

        {/* Row 6: Alert History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Kriz Uyarı Geçmişi
              {alerts.length > 0 && (
                <Badge variant="destructive" className="text-[10px]">{alerts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrisisAlertHistory alerts={alerts} loading={alertsLoading} />
          </CardContent>
        </Card>

        {/* Row 7: Score Breakdown + Basin Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                Skor Detayları
                {isHydroLive && <Badge variant="secondary" className="text-[10px]">Hidrolojik</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hydroCrisis ? (
                <HydroCrisisBreakdown scores={hydroCrisis} />
              ) : (
                <ScoreBreakdown scores={latest.scores} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Havza Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <BasinInfo />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
