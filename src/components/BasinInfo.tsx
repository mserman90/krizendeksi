import { MapPin, Waves, Mountain } from "lucide-react";
import type { BasinConfig } from "@/lib/basinConfig";

interface Props {
  basin: BasinConfig;
}

const BasinInfo = ({ basin }: Props) => {
  const icons = [MapPin, Waves, Mountain, Waves, Waves];

  return (
    <div className="space-y-3">
      {basin.facts.map(({ label, value }, i) => {
        const Icon = icons[i % icons.length];
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          </div>
        );
      })}
      <div className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3 space-y-1">
        <p>Paylaşan ülkeler: {basin.countries.join(", ")}</p>
        <p>Veri kaynakları: Open-Meteo, NASA POWER, GloFAS</p>
      </div>
    </div>
  );
};

export default BasinInfo;
