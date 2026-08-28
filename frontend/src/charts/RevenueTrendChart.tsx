import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "../components/EmptyState";
import { formatCurrency, formatDate } from "../utils/format";
import { HistoryPoint } from "../types/drclick";

export function RevenueTrendChart({ data }: { data: HistoryPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState message="Ainda não há histórico sincronizado para este período. Use 'Sincronizar agora' para começar a registrar a evolução." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label: string) => formatDate(label)}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Line type="monotone" dataKey="revenue" name="Faturamento" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
