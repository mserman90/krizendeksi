import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bell, BellOff, ShieldAlert, Shield, ShieldCheck } from "lucide-react";
import type { CrisisAlert } from "@/hooks/useCrisisAlerts";

interface Props {
  alerts: CrisisAlert[];
  loading: boolean;
}

function getLevelConfig(level: string) {
  switch (level) {
    case "critical":
      return { label: "Kritik", icon: ShieldAlert, className: "bg-red-500/10 text-red-600 border-red-500/30" };
    case "high":
      return { label: "Yüksek", icon: AlertTriangle, className: "bg-orange-500/10 text-orange-600 border-orange-500/30" };
    case "medium":
      return { label: "Orta", icon: Shield, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" };
    default:
      return { label: "Düşük", icon: ShieldCheck, className: "bg-green-500/10 text-green-600 border-green-500/30" };
  }
}

const CrisisAlertHistory = ({ alerts, loading }: Props) => {
  if (loading) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground animate-pulse">
        Uyarılar yükleniyor...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <BellOff className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Henüz kriz uyarısı yok</p>
        <p className="text-[10px] mt-1">Kriz endeksi ≥60 olduğunda otomatik uyarı oluşturulur</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 pr-3">
        {alerts.map((alert) => {
          const config = getLevelConfig(alert.level);
          const Icon = config.icon;
          const date = new Date(alert.created_at);

          return (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${config.className}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">
                      Kriz Endeksi: <span className="font-mono">{alert.crisis_index}</span>
                    </p>
                    <p className="text-[10px] opacity-80">
                      {date.toLocaleDateString("tr-TR")} · {date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {config.label}
                </Badge>
              </div>
              {alert.summary && (
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] opacity-80">
                  {alert.summary.totalPrecip != null && (
                    <span>Yağış: {alert.summary.totalPrecip} mm</span>
                  )}
                  {alert.summary.avgDischarge != null && (
                    <span>Debi: {alert.summary.avgDischarge} m³/s</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default CrisisAlertHistory;
