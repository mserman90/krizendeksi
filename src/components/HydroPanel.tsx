import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Droplets,
  CloudRain,
  Snowflake,
  Thermometer,
  Waves,
  Wind,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import type { HydroData } from "@/lib/api/hydroApi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface HydroPanelProps {
  data: HydroData | null;
  loading: boolean;
  error: string | null;
  warnings: string[];
  onFetch: (pastDays?: number) => void;
}

const HydroPanel = ({ data, loading, error, warnings, onFetch }: HydroPanelProps) => {
  const isLive = data !== null;

  // Prepare chart data for precipitation
  const precipChart = data?.precipitation
    .filter((p) => p.source === "open-meteo")
    .map((p) => ({
      date: p.date.slice(5),
      yağış: p.mm,
    })) ?? [];

  // River discharge chart
  const dischargeChart = data?.riverDischarge
    .filter((d) => d.location === "Atatürk")
    .map((d) => ({
      date: d.date.slice(5),
      debi: Math.round(d.m3s),
      medyan: d.median ? Math.round(d.median) : undefined,
    })) ?? [];

  // Evapotranspiration + soil moisture chart
  const evapChart = data?.evapotranspiration
    .filter((e) => e.source === "open-meteo")
    .map((e) => {
      const soil = data.soilMoisture.find((s) => s.date === e.date);
      return {
        date: e.date.slice(5),
        buharlaşma: e.mm,
        toprakNemi: soil ? Math.round(soil.value * 1000) / 10 : undefined,
      };
    }) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {isLive
              ? `Canlı Veri · ${data.summary.dataSourcesUsed.join(", ")}`
              : "Henüz veri çekilmedi"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFetch(14)}
          disabled={loading}
          className="h-7 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Çekiliyor..." : "Veri Çek"}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded px-3 py-2">
          ⚠️ {warnings.length} kaynak uyarısı
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <SummaryCard icon={CloudRain} label="Toplam Yağış" value={`${data.summary.totalPrecipMm}`} unit="mm" />
            <SummaryCard icon={Waves} label="Ort. Debi" value={`${data.summary.avgDischargeM3s}`} unit="m³/s" />
            <SummaryCard icon={Droplets} label="Toprak Nemi" value={`${(data.summary.avgSoilMoisture * 100).toFixed(1)}`} unit="%" />
            <SummaryCard icon={Wind} label="Buharlaşma" value={`${data.summary.totalEvapMm}`} unit="mm" />
            <SummaryCard icon={Thermometer} label="Ort. Sıcaklık" value={`${data.summary.avgTempC}`} unit="°C" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <SummaryCard icon={Snowflake} label="Kar Yağışı" value={`${data.summary.totalSnowfallMm}`} unit="mm" />
            <SummaryCard icon={Droplets} label="Nem Oranı" value={`${data.summary.avgHumidity}`} unit="%" />
            <SummaryCard icon={Wind} label="Rüzgar Hızı" value={`${data.summary.avgWindSpeed}`} unit="km/s" />
            <SummaryCard icon={Thermometer} label="Güneş Rad." value={`${data.summary.avgSolarRadiation}`} unit="kWh/m²" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Precipitation Chart */}
            {precipChart.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CloudRain className="h-4 w-4" /> Günlük Yağış (Open-Meteo)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={precipChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        formatter={(val: number) => [`${val} mm`, "Yağış"]}
                      />
                      <Bar dataKey="yağış" fill="hsl(200, 70%, 50%)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* River Discharge Chart */}
            {dischargeChart.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Waves className="h-4 w-4" /> Nehir Debisi — Atatürk (GloFAS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={dischargeChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="debi" stroke="hsl(210, 80%, 55%)" strokeWidth={2} dot={false} name="Debi (m³/s)" />
                      {dischargeChart.some(d => d.medyan) && (
                        <Line type="monotone" dataKey="medyan" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Medyan" />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Evapotranspiration + Soil Moisture */}
            {evapChart.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wind className="h-4 w-4" /> Buharlaşma & Toprak Nemi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={evapChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line yAxisId="left" type="monotone" dataKey="buharlaşma" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={false} name="ET₀ (mm)" />
                      <Line yAxisId="right" type="monotone" dataKey="toprakNemi" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Toprak Nemi (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Snowfall Chart */}
            {data.snowfall.some(s => s.mm > 0) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Snowflake className="h-4 w-4" /> Kar Yağışı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.snowfall.map(s => ({ date: s.date.slice(5), kar: s.mm }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        formatter={(val: number) => [`${val} mm`, "Kar"]}
                      />
                      <Bar dataKey="kar" fill="hsl(200, 30%, 75%)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Period Info */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <span>Dönem: {data.summary.periodStart} — {data.summary.periodEnd}</span>
            <span>·</span>
            <span>Güncelleme: {new Date(data.summary.fetchedAt).toLocaleString("tr-TR")}</span>
            {data.summary.dataSourcesUsed.map((s) => (
              <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">
                {s}
              </Badge>
            ))}
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Droplets className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>"Veri Çek" butonuna tıklayarak Open-Meteo, NASA POWER ve GloFAS verilerini yükleyin.</p>
        </div>
      )}
    </div>
  );
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold font-mono leading-tight">{value}</p>
      <p className="text-[9px] text-muted-foreground">{unit}</p>
      <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export default HydroPanel;
