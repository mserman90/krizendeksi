import type { NatoCrisisScores } from "@/lib/mockData";
import { Droplets, TrendingDown, Thermometer, Building2, Wheat, AlertTriangle } from "lucide-react";

interface Props {
  scores: NatoCrisisScores;
}

const items = [
  { key: "waterScarcityScore" as const, label: "Su Kıtlığı Stresi", weight: "25%", icon: Droplets, desc: "Yağış açığı ve nehir debisi — NATO su/gıda dayanıklılık temeli" },
  { key: "hydrologicalAnomalyScore" as const, label: "Hidrolojik Anomali", weight: "20%", icon: TrendingDown, desc: "Tarihsel normlardan sapma — NATO tehdit değerlendirmesi" },
  { key: "evaporativeDemandScore" as const, label: "Buharlaşma Baskısı", weight: "15%", icon: Thermometer, desc: "Isı + buharlaşma + rüzgar — kademeli çevresel stres" },
  { key: "infrastructureRiskScore" as const, label: "Kritik Altyapı Riski", weight: "15%", icon: Building2, desc: "Düşük akış ve nem stresi — sivil ulaşım ve enerji dayanıklılığı" },
  { key: "foodSecurityScore" as const, label: "Gıda Güvenliği", weight: "15%", icon: Wheat, desc: "Toprak nemi + yağış + kar deposu — tarımsal üretim riski" },
  { key: "cascadingInstabilityScore" as const, label: "Kademeli İstikrarsızlık", weight: "10%", icon: AlertTriangle, desc: "Çoklu stres faktörlerinin eşzamanlı tetiklenmesi — NATO tehdit çarpanı" },
];

function getBarColor(val: number) {
  if (val < 25) return "bg-green-500";
  if (val < 50) return "bg-yellow-500";
  if (val < 75) return "bg-orange-500";
  return "bg-red-500";
}

const NatoCrisisBreakdown = ({ scores }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary">N</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">NATO CCSIA Metodolojisi</span>
      </div>
      {items.map(({ key, label, weight, icon: Icon, desc }) => {
        const val = scores[key];
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-[10px] text-muted-foreground">({weight})</span>
              </div>
              <span className="text-sm font-mono font-semibold">{Math.round(val)}</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all ${getBarColor(val)}`}
                style={{ width: `${val}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </div>
        );
      })}
    </div>
  );
};

export default NatoCrisisBreakdown;
