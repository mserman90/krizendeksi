import type { HydroCrisisScores } from "@/lib/mockData";
import { Droplets, Waves, Leaf, Thermometer, Snowflake } from "lucide-react";

interface Props {
  scores: HydroCrisisScores;
}

const items = [
  { key: "dischargeScore" as const, label: "Nehir Debisi", weight: "30%", icon: Waves, desc: "Debi düştükçe kriz riski artar" },
  { key: "precipScore" as const, label: "Yağış Miktarı", weight: "25%", icon: Droplets, desc: "Yağış azaldıkça kriz riski artar" },
  { key: "soilMoistureScore" as const, label: "Toprak Nemi", weight: "20%", icon: Leaf, desc: "Toprak kurudukça kriz riski artar" },
  { key: "evapScore" as const, label: "Buharlaşma", weight: "15%", icon: Thermometer, desc: "Buharlaşma arttıkça kriz riski artar" },
  { key: "snowScore" as const, label: "Kar Yağışı", weight: "10%", icon: Snowflake, desc: "Kar azaldıkça su deposu riski artar" },
];

function getBarColor(val: number) {
  if (val < 25) return "bg-green-500";
  if (val < 50) return "bg-yellow-500";
  if (val < 75) return "bg-orange-500";
  return "bg-red-500";
}

const HydroCrisisBreakdown = ({ scores }: Props) => {
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

export default HydroCrisisBreakdown;
