import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
      <AreaChart data={chartData} margin={{ top: 24, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        {/* Folga nas pontas pros numeros do primeiro/ultimo ponto nao
            ficarem em cima do eixo Y nem cortados na borda. */}
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
          padding={{ left: 20, right: 20 }}
        />
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
          // Sem animacao: ao gerar o PDF a largura muda, o grafico refaria a
          // animacao e o html2canvas capturaria a curva no meio do caminho e
          // sem os numeros (o LabelList so aparece quando a animacao termina).
          isAnimationActive={false}
        >
          {/* Valor escrito em cima de cada ponto - sem isso o numero so
              aparece no tooltip (hover) e some no PDF/impressao. */}
          <LabelList
            dataKey="value"
            position="top"
            offset={8}
            fontSize={11}
            fontWeight={600}
            fill="#334155"
            formatter={(v: number | null | undefined) => (v === null || v === undefined ? "" : formatValue(Number(v)))}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}
