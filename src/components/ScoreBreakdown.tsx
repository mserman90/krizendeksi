import type { CrisisScores } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Droplets, CloudRain, Newspaper } from "lucide-react";

interface ScoreBreakdownProps {
  scores: CrisisScores;
}

const items = [
  { key: "areaScore" as const, label: "Rezervuar Alanı", weight: "40%", icon: Droplets, desc: "Alan küçüldükçe risk artar" },
  { key: "rainScore" as const, label: "Yağış Durumu", weight: "30%", icon: CloudRain, desc: "Yağış azaldıkça risk artar" },
  { key: "newsScore" as const, label: "Haber Yoğunluğu", weight: "30%", icon: Newspaper, desc: "Haber sayısı arttıkça risk artar" },
];

function getBarColor(val: number) {
  if (val < 25) return "bg-green-500";
  if (val < 50) return "bg-yellow-500";
  if (val < 75) return "bg-orange-500";
  return "bg-red-500";
}

const ScoreBreakdown = ({ scores }: ScoreBreakdownProps) => {
  return (
    <div className="space-y-4">
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

export default ScoreBreakdown;
