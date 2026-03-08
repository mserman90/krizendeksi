import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCrisisLevel, computeHydroCrisisIndex } from "@/lib/mockData";
import type { HydroCrisisScores } from "@/lib/mockData";
import CrisisGauge from "@/components/CrisisGauge";
import HydroCrisisBreakdown from "@/components/HydroCrisisBreakdown";
import MethodologyDialog from "@/components/MethodologyDialog";
import BasinInfo from "@/components/BasinInfo";
import BasinMap from "@/components/BasinMap";
import HydroPanel from "@/components/HydroPanel";
import CrisisAlertBanner from "@/components/CrisisAlertBanner";
import CrisisAlertHistory from "@/components/CrisisAlertHistory";
import ThemeToggle from "@/components/ThemeToggle";
import { useHydroData } from "@/hooks/useHydroData";
import { useCrisisAlerts } from "@/hooks/useCrisisAlerts";
import { BASINS, type BasinConfig } from "@/lib/basinConfig";
import { Activity, Droplets, CloudRain, Map, Database, Bell, TrendingUp, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveHydroSnapshot } from "@/lib/api/snapshotApi";
import WeeklyTrendChart from "@/components/WeeklyTrendChart";
import { toast } from "sonner";

const BasinDashboard = ({ basin }: { basin: BasinConfig }) => {
  const hydro = useHydroData();
  const [alertThreshold, setAlertThreshold] = useState(60);
  const [saving, setSaving] = useState(false);
  const [trendKey, setTrendKey] = useState(0);

  useEffect(() => {
    hydro.reset();
    hydro.fetch(14, basin.id);
  }, [basin.id]);

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

  const handleSave = useCallback(async () => {
    if (!hydro.data?.summary || !hydroCrisis) return;
    setSaving(true);
    try {
      await saveHydroSnapshot({
        basinId: basin.id,
        crisisIndex: Math.round(hydroCrisis.weeklyIndex * 10) / 10,
        summary: {
          totalPrecipMm: hydro.data.summary.totalPrecipMm,
          avgDischargeM3s: hydro.data.summary.avgDischargeM3s,
          avgSoilMoisture: hydro.data.summary.avgSoilMoisture,
          totalEvapMm: hydro.data.summary.totalEvapMm,
          totalSnowfallMm: hydro.data.summary.totalSnowfallMm,
          avgHumidity: hydro.data.summary.avgHumidity,
          avgWindSpeed: hydro.data.summary.avgWindSpeed,
          avgSolarRadiation: hydro.data.summary.avgSolarRadiation,
          dischargeAnomalyRatio: hydro.data.summary.dischargeAnomalyRatio,
        },
        periodStart: hydro.data.summary.periodStart,
        periodEnd: hydro.data.summary.periodEnd,
      });
      toast.success("Veriler kaydedildi");
      setTrendKey((k) => k + 1);
    } catch (e: any) {
      toast.error("Kaydetme hatası: " + e.message);
    } finally {
      setSaving(false);
    }
  }, [hydro.data, hydroCrisis, basin.id]);
  const crisisValue = hydroCrisis?.weeklyIndex ?? 50;
  const isHydroLive = hydroCrisis !== null;

  return (
    <div className="space-y-6">
      <CrisisAlertBanner crisisIndex={crisisValue} threshold={alertThreshold} />

      {/* Row 1: Crisis Gauge + Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Kriz Endeksi
              {isHydroLive && <Badge variant="secondary" className="text-[10px]">Canlı</Badge>}
              {hydro.loading && <span className="text-[10px] text-muted-foreground animate-pulse">Yükleniyor...</span>}
              <MethodologyDialog />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <CrisisGauge value={crisisValue} />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Uyarı Eşiği</span>
                <span className="text-xs font-mono font-semibold">{alertThreshold}</span>
              </div>
              <input
                type="range"
                min={20}
                max={90}
                step={5}
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-full h-1.5 accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>20</span>
                <span>90</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Toplam Yağış
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isHydroLive ? (
              <>
                <p className="text-3xl font-bold font-mono">{hydro.data!.summary.totalPrecipMm}</p>
                <p className="text-xs text-muted-foreground">mm (havza toplam)</p>
                <p className="text-xs mt-2">
                  Skor: <span className="font-mono font-semibold">{Math.round(hydroCrisis!.precipScore)}</span>/100
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Veri bekleniyor...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CloudRain className="h-4 w-4" /> Ort. Nehir Debisi
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
              <p className="text-sm text-muted-foreground">Veri bekleniyor...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Basin Map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Map className="h-4 w-4" /> {basin.name} Haritası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BasinMap basin={basin} />
        </CardContent>
      </Card>

      {/* Row 3: Hydro Data Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" /> Hidrolojik Veriler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HydroPanel
            data={hydro.data}
            loading={hydro.loading}
            error={hydro.error}
            warnings={hydro.warnings}
            onFetch={(days) => hydro.fetch(days, basin.id)}
          />
        </CardContent>
      </Card>

      {/* Row 4: Save & Weekly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Haftalık Trend Karşılaştırması
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5"
                onClick={handleSave}
                disabled={saving || !isHydroLive}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Kaydediliyor..." : "Verileri Kaydet"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyTrendChart key={trendKey} basinId={basin.id} />
        </CardContent>
      </Card>

      {/* Row 5: Score Breakdown + Basin Info */}
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
              <p className="text-sm text-muted-foreground text-center py-4">Veri yükleniyor...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Havza Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <BasinInfo basin={basin} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Index = () => {
  const [activeBasin, setActiveBasin] = useState(BASINS[0].id);
  const { alerts, loading: alertsLoading } = useCrisisAlerts();
  const currentBasin = BASINS.find((b) => b.id === activeBasin) ?? BASINS[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Sınıraşan Su Havzaları OSINT İzleme Paneli</h1>
              <p className="text-xs text-muted-foreground">
                Türkiye'nin sınıraşan su havzalarının gerçek zamanlı hidrolojik izleme sistemi
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeBasin} onValueChange={setActiveBasin} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {BASINS.map((basin) => (
              <TabsTrigger
                key={basin.id}
                value={basin.id}
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 min-w-[120px]"
              >
                {basin.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {BASINS.map((basin) => (
            <TabsContent key={basin.id} value={basin.id} className="mt-4">
              <BasinDashboard basin={basin} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Alert History (shared across basins) */}
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
      </main>
    </div>
  );
};

export default Index;
