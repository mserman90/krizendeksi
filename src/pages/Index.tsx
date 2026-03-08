import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateWeeklyTimeSeries, generateMockNews, getCrisisLevel } from "@/lib/mockData";
import type { NewsItem } from "@/lib/mockData";
import { fetchRssNews } from "@/lib/api/rssApi";
import CrisisGauge from "@/components/CrisisGauge";
import ReservoirChart from "@/components/ReservoirChart";
import RainfallChart from "@/components/RainfallChart";
import NewsPanel from "@/components/NewsPanel";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import BasinInfo from "@/components/BasinInfo";
import BasinMap from "@/components/BasinMap";
import { Activity, Droplets, CloudRain, Newspaper, Map } from "lucide-react";

const Index = () => {
  const timeSeries = useMemo(() => generateWeeklyTimeSeries(12), []);
  const mockNews = useMemo(() => generateMockNews(), []);
  const latest = timeSeries[timeSeries.length - 1];
  const { label } = getCrisisLevel(latest.scores.weeklyIndex);

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
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Fırat-Dicle Haftalık OSINT İzleme Paneli</h1>
            <p className="text-xs text-muted-foreground">
              {latest.metrics.weekStart} — {latest.metrics.weekEnd} · Durum: {label}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Row 1: Crisis Gauge + Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Kriz Endeksi
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CrisisGauge value={latest.scores.weeklyIndex} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4" /> Rezervuar Alanı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">{latest.metrics.reservoirAreaKm2}</p>
              <p className="text-xs text-muted-foreground">km² (Atatürk Barajı)</p>
              <p className="text-xs mt-2">
                Skor: <span className="font-mono font-semibold">{Math.round(latest.scores.areaScore)}</span>/100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CloudRain className="h-4 w-4" /> Haftalık Yağış
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">{latest.metrics.basinRainMm}</p>
              <p className="text-xs text-muted-foreground">mm (havza ortalaması)</p>
              <p className="text-xs mt-2">
                Skor: <span className="font-mono font-semibold">{Math.round(latest.scores.rainScore)}</span>/100
              </p>
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

        {/* Row 5: Score Breakdown + Basin Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Skor Detayları</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown scores={latest.scores} />
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
