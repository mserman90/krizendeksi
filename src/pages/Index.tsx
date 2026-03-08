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
    <div className="space-y-5">
      <CrisisAlertBanner crisisIndex={crisisValue} threshold={alertThreshold} />

      {/* Row 1: Crisis Gauge + Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Kriz Endeksi
              {isHydroLive && <Badge variant="secondary" className="text-[10px] font-medium">● Canlı</Badge>}
              {hydro.loading && <span className="text-[10px] text-muted-foreground animate-pulse">Yükleniyor...</span>}
              <MethodologyDialog />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <CrisisGauge value={crisisValue} />
            </div>
            <div className="space-y-1.5 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium">Uyarı Eşiği</span>
                <span className="text-xs font-mono font-bold text-primary">{alertThreshold}</span>
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

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" /> Toplam Yağış
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isHydroLive ? (
              <div className="space-y-1">
                <p className="stat-value">{hydro.data!.summary.totalPrecipMm}</p>
                <p className="text-xs text-muted-foreground font-medium">mm · 14 günlük toplam</p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(hydroCrisis!.precipScore, 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold">{Math.round(hydroCrisis!.precipScore)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground animate-pulse">Veri bekleniyor...</p>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-primary" /> Ort. Nehir Debisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isHydroLive ? (
              <div className="space-y-1">
                <p className="stat-value">{hydro.data!.summary.avgDischargeM3s}</p>
                <p className="text-xs text-muted-foreground font-medium">m³/s · havza ortalaması</p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(hydroCrisis!.dischargeScore, 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono font-bold">{Math.round(hydroCrisis!.dischargeScore)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground animate-pulse">Veri bekleniyor...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Basin Map */}
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="section-title flex items-center gap-2">
            <Map className="h-4 w-4 text-primary" /> {basin.name} Haritası
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4 px-4">
          <BasinMap basin={basin} />
        </CardContent>
      </Card>

      {/* Row 3: Hydro Data Panel */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="section-title flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" /> Hidrolojik Veriler
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
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="section-title flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Haftalık Trend
            <div className="ml-auto">
              <Button
                size="sm"
                className="text-xs gap-1.5 font-semibold"
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
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title flex items-center gap-2">
              Skor Detayları
              {isHydroLive && <Badge variant="secondary" className="text-[10px] font-medium">● Hidrolojik</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hydroCrisis ? (
              <HydroCrisisBreakdown scores={hydroCrisis} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 animate-pulse">Veri yükleniyor...</p>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title">Havza Bilgileri</CardTitle>
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
      <header className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-md" style={{ background: 'var(--gradient-header)' }}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-primary-foreground truncate">
                Sınıraşan Su Havzaları OSINT
              </h1>
              <p className="text-[10px] sm:text-[11px] text-primary-foreground/60 font-medium hidden sm:block">
                Gerçek zamanlı hidrolojik izleme · Open-Meteo · GloFAS · NASA POWER
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 sm:space-y-5">
        <Tabs value={activeBasin} onValueChange={setActiveBasin} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-full flex h-auto gap-1 sm:gap-1.5 bg-card border border-border p-1 sm:p-1.5 rounded-lg min-w-max sm:min-w-0 sm:flex-wrap">
              {BASINS.map((basin) => (
                <TabsTrigger
                  key={basin.id}
                  value={basin.id}
                  className="text-[11px] sm:text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 min-w-[90px] sm:min-w-[120px] rounded-md transition-all px-2 sm:px-3 py-1.5"
                >
                  {basin.shortName}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {BASINS.map((basin) => (
            <TabsContent key={basin.id} value={basin.id} className="mt-4">
              <BasinDashboard basin={basin} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Alert History */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="section-title flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Kriz Uyarı Geçmişi
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

      <footer className="border-t border-border/40 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>© 2026 Sınıraşan Su Havzaları OSINT</span>
          <span>Veri: Open-Meteo · GloFAS · NASA POWER</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
