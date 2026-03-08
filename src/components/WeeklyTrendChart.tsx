import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { fetchSnapshots, type HydroSnapshot } from "@/lib/api/snapshotApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  basinId: string;
}

interface WeeklyAggregate {
  week: string;
  avgCrisisIndex: number;
  avgPrecip: number;
  avgDischarge: number;
  avgHumidity: number;
  avgSnowfall: number;
  count: number;
}

function aggregateByWeek(snapshots: HydroSnapshot[]): WeeklyAggregate[] {
  const weekMap = new Map<string, HydroSnapshot[]>();

  for (const s of snapshots) {
    const d = new Date(s.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(s);
  }

  const weeks: WeeklyAggregate[] = [];
  for (const [week, items] of weekMap) {
    const avg = (fn: (s: HydroSnapshot) => number) =>
      Math.round((items.reduce((sum, s) => sum + fn(s), 0) / items.length) * 10) / 10;

    weeks.push({
      week,
      avgCrisisIndex: avg((s) => s.crisis_index),
      avgPrecip: avg((s) => s.total_precip_mm),
      avgDischarge: avg((s) => s.avg_discharge_m3s),
      avgHumidity: avg((s) => s.avg_humidity),
      avgSnowfall: avg((s) => s.total_snowfall_mm),
      count: items.length,
    });
  }

  return weeks.sort((a, b) => a.week.localeCompare(b.week));
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : 0;

  if (Math.abs(pct) < 3) return <Badge variant="secondary" className="text-[10px] gap-1"><Minus className="h-3 w-3" /> Sabit</Badge>;
  if (diff > 0) return <Badge variant="destructive" className="text-[10px] gap-1"><TrendingUp className="h-3 w-3" /> +{pct}%</Badge>;
  return <Badge className="text-[10px] gap-1 bg-emerald-600"><TrendingDown className="h-3 w-3" /> {pct}%</Badge>;
}

export default function WeeklyTrendChart({ basinId }: Props) {
  const [snapshots, setSnapshots] = useState<HydroSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSnapshots(basinId, 200)
      .then(setSnapshots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [basinId]);

  if (loading) return <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Trend verileri yükleniyor...</p>;
  if (error) return <p className="text-sm text-destructive py-4 text-center">{error}</p>;
  if (snapshots.length === 0) return (
    <div className="text-center py-8 space-y-2">
      <p className="text-sm text-muted-foreground">Henüz kaydedilmiş veri yok.</p>
      <p className="text-xs text-muted-foreground">Hidrolojik verileri yükledikten sonra "Verileri Kaydet" butonuna tıklayarak trend takibi başlatabilirsiniz.</p>
    </div>
  );

  const weeks = aggregateByWeek(snapshots);
  const lastTwo = weeks.slice(-2);
  const hasTrend = lastTwo.length === 2;

  const formatWeek = (w: string) => {
    const d = new Date(w);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {hasTrend && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Kriz Endeksi</p>
            <TrendBadge current={lastTwo[1].avgCrisisIndex} previous={lastTwo[0].avgCrisisIndex} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Yağış</p>
            <TrendBadge current={lastTwo[1].avgPrecip} previous={lastTwo[0].avgPrecip} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Debi</p>
            <TrendBadge current={lastTwo[1].avgDischarge} previous={lastTwo[0].avgDischarge} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">Nem</p>
            <TrendBadge current={lastTwo[1].avgHumidity} previous={lastTwo[0].avgHumidity} />
          </div>
        </div>
      )}

      <Tabs defaultValue="crisis" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="crisis" className="text-[11px]">Kriz Endeksi</TabsTrigger>
          <TabsTrigger value="hydro" className="text-[11px]">Hidrolojik</TabsTrigger>
        </TabsList>

        <TabsContent value="crisis" className="mt-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="week" tickFormatter={formatWeek} className="text-[10px]" />
              <YAxis domain={[0, 100]} className="text-[10px]" />
              <Tooltip
                labelFormatter={(v) => `Hafta: ${v}`}
                formatter={(v: number) => [v.toFixed(1), "Kriz Endeksi"]}
              />
              <Line type="monotone" dataKey="avgCrisisIndex" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Kriz Endeksi" />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="hydro" className="mt-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="week" tickFormatter={formatWeek} className="text-[10px]" />
              <YAxis className="text-[10px]" />
              <Tooltip labelFormatter={(v) => `Hafta: ${v}`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="avgPrecip" fill="hsl(var(--primary))" name="Yağış (mm)" />
              <Bar dataKey="avgDischarge" fill="hsl(var(--accent))" name="Debi (m³/s)" />
              <Bar dataKey="avgSnowfall" fill="hsl(var(--muted-foreground))" name="Kar (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>

      <p className="text-[10px] text-muted-foreground text-right">{snapshots.length} kayıt, {weeks.length} hafta</p>
    </div>
  );
}
