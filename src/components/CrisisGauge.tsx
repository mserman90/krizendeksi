import { getCrisisLevel } from "@/lib/mockData";

interface CrisisGaugeProps {
  value: number;
}

const CrisisGauge = ({ value }: CrisisGaugeProps) => {
  const { label, color } = getCrisisLevel(value);
  const rotation = (value / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-48 h-28 overflow-hidden">
        {/* Background arc */}
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Green zone */}
          <path
            d="M 20 100 A 80 80 0 0 1 60 32"
            fill="none"
            stroke="hsl(var(--crisis-low))"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Yellow zone */}
          <path
            d="M 60 32 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="hsl(var(--crisis-medium))"
            strokeWidth="16"
          />
          {/* Orange zone */}
          <path
            d="M 100 20 A 80 80 0 0 1 140 32"
            fill="none"
            stroke="hsl(var(--crisis-high))"
            strokeWidth="16"
          />
          {/* Red zone */}
          <path
            d="M 140 32 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--crisis-critical))"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="35"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${rotation}, 100, 100)`}
          />
          <circle cx="100" cy="100" r="6" fill="hsl(var(--foreground))" />
        </svg>
      </div>
      <div className="text-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {Math.round(value)}
        </span>
        <span className="text-sm text-muted-foreground ml-1">/ 100</span>
      </div>
      <span
        className="text-sm font-semibold px-3 py-1 rounded-full"
        style={{ backgroundColor: color, color: value > 50 ? "white" : "hsl(var(--foreground))" }}
      >
        {label} Risk
      </span>
    </div>
  );
};

export default CrisisGauge;
