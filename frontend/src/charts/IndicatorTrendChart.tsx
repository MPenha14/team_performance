import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "../components/EmptyState";

export function formatMonthShort(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
}

interface IndicatorTrendChartProps<T> {
  data: T[];
  month: (item: T) => string;
  value: (item: T) => number | null;
  label: string;
  color: string;
  formatValue: (value: number) => string;
  domain?: [number, number];
}

// Grafico de area de uma unica serie - evolucao de UM indicador no tempo
// (um por indicador, nunca varios indicadores de escalas diferentes no
// mesmo eixo). Meses sem dado ficam como buraco no traco (connectNulls
// false), nunca interpolados como se o valor existisse.
export function IndicatorTrendChart<T>({
  data,
  month,
  value,
  label,
  color,
  formatValue,
  domain,
}: IndicatorTrendChartProps<T>) {
  if (!data || data.length === 0) {
    return <EmptyState message="Sem histórico suficiente para montar a evolução." />;
  }

  const chartData = data.map((item) => {
    const v = value(item);
    return { month: formatMonthShort(month(item)), value: v !== null ? Number(v.toFixed(2)) : null };
  });

  const gradientId = `trend-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          domain={domain ?? [0, "auto"]}
          width={40}
        />
        <Tooltip
          formatter={(v: number) => [formatValue(v), label]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name={label}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
