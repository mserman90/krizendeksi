import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  crisisIndex: number;
  threshold?: number;
}

const CrisisAlertBanner = ({ crisisIndex, threshold = 60 }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when crisis level changes significantly
  useEffect(() => {
    setDismissed(false);
  }, [Math.floor(crisisIndex / 10)]);

  if (dismissed || crisisIndex < threshold) return null;

  const isCritical = crisisIndex >= 75;

  return (
    <div
      className={`rounded-lg border px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 ${
        isCritical
          ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
          : "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400"
      }`}
    >
      <div className="flex items-center gap-3">
        {isCritical ? (
          <ShieldAlert className="h-5 w-5 shrink-0 animate-pulse" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {isCritical ? "⚠️ Kritik Kriz Uyarısı" : "🔶 Yüksek Kriz Uyarısı"}
          </p>
          <p className="text-xs opacity-80">
            Kriz endeksi <span className="font-mono font-bold">{Math.round(crisisIndex)}</span> — 
            eşik değer ({threshold}) aşıldı. 
            {isCritical
              ? " Acil müdahale gerekebilir."
              : " Durum yakından izlenmeli."}
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CrisisAlertBanner;
