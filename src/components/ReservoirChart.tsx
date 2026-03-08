import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyData } from "@/lib/mockData";

interface ReservoirChartProps {
  data: WeeklyData[];
}

const ReservoirChart = ({ data }: ReservoirChartProps) => {
  const chartData = data.map((d) => ({
    week: d.metrics.weekEnd.slice(5), // MM-DD
    area: d.metrics.reservoirAreaKm2,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          label={{ value: "km²", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(val: number) => [`${val} km²`, "Su Alanı"]}
        />
        <Area
          type="monotone"
          dataKey="area"
          stroke="hsl(210, 80%, 55%)"
          strokeWidth={2}
          fill="url(#areaGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ReservoirChart;
