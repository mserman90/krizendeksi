import type { NatoCrisisScores } from "@/lib/mockData";
import { ShieldAlert, Brain, PackageOpen, Zap, Crosshair } from "lucide-react";

interface Props {
  scores: NatoCrisisScores;
}

const items = [
  { key: "ccsrtScore" as const, label: "CCSRT", fullLabel: "İklim Güvenlik Risk Eşiği", weight: "25%", icon: ShieldAlert, desc: "Yağış açığı, debi düşüşü ve buharlaşma baskısının güvenlik-kritik eşikleri aşma riski. 7BLR: Gıda/Su Temini, Enerji Arzı." },
  { key: "pacaScore" as const, label: "PACA", fullLabel: "Öngörücü Adaptif Kapasite", weight: "25%", icon: Brain, desc: "Tarihsel normlardan sapma + göstergeler arası varyans. Yüksek sapma = düşük adaptif kapasite. 7BLR: Sivil İletişim, Yönetim Sürekliliği." },
  { key: "rsiScore" as const, label: "RSI", fullLabel: "Kaynak Kıtlığı Endeksi", weight: "20%", icon: PackageOpen, desc: "Toprak nemi, yağış, kar deposu ve rüzgar kurutma etkisinin çok boyutlu kaynak tükenme göstergesi. 7BLR: Gıda/Su, Enerji." },
  { key: "blackStartScore" as const, label: "BlackStart", fullLabel: "Altyapı Çöküş Potansiyeli", weight: "20%", icon: Zap, desc: "Düşük akış + güneş yükü + buharlaşma baskısı birleşik stresi. 2+ faktör eşzamanlı stres altındaysa bileşik çarpan uygulanır. 7BLR: Sivil Ulaşım, Enerji, Kitle Kayıp Yönetimi." },
  { key: "kineticScore" as const, label: "Kinetic", fullLabel: "Çatışma & Yerinden Edilme Tetikleyicisi", weight: "10%", icon: Crosshair, desc: "Tüm sütunlar stres altındayken üstel tehdit çarpanı. NATO 'threat multiplier' konsepti. 7BLR: Kontrolsüz Nüfus Hareketleri, Yönetim Sürekliliği." },
];

function getBarColor(val: number) {
  if (val < 25) return "bg-green-500";
  if (val < 50) return "bg-yellow-500";
  if (val < 75) return "bg-orange-500";
  return "bg-red-500";
}

function getNatoThreatLevel(val: number) {
  if (val < 25) return { label: "ALPHA", color: "text-green-600 dark:text-green-400" };
  if (val < 50) return { label: "BRAVO", color: "text-yellow-600 dark:text-yellow-400" };
  if (val < 75) return { label: "CHARLIE", color: "text-orange-600 dark:text-orange-400" };
  return { label: "DELTA", color: "text-red-600 dark:text-red-400" };
}

const NatoCrisisBreakdown = ({ scores }: Props) => {
  const threat = getNatoThreatLevel(scores.weeklyIndex);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">N</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">NATO 360° / 7BLR Metodolojisi</span>
        </div>
        <span className={`text-[10px] font-mono font-bold ${threat.color}`}>
          THREATCON {threat.label}
        </span>
      </div>

      {/* S_Allied Formula Display */}
      <div className="rounded-lg bg-muted/50 border border-border p-2 font-mono text-[10px] text-muted-foreground">
        S_Allied = (CCSRT×0.25) + (PACA×0.25) + (RSI×0.20) + (BlackStart×0.20) + (Kinetic×0.10)
      </div>

      {items.map(({ key, label, fullLabel, weight, icon: Icon, desc }) => {
        const val = scores[key];
        const level = getNatoThreatLevel(val);
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold font-mono">{label}</span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">· {fullLabel}</span>
                <span className="text-[10px] text-muted-foreground">({weight})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-mono font-bold ${level.color}`}>{level.label}</span>
                <span className="text-sm font-mono font-semibold">{Math.round(val)}</span>
              </div>
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
