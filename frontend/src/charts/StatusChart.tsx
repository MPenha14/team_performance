import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ServiceChannelSummaryItem } from "../types/drclick";
import { EmptyState } from "../components/EmptyState";

// Cores por status conhecido (apenas visual - o nome exibido e' sempre
// exatamente o que a API retornou, nunca traduzido ou inventado).
const STATUS_COLORS: Record<string, string> = {
  atendido: "#059669",
  confirmado: "#2563eb",
  agendado: "#7c3aed",
  checkin: "#d97706",
  cancelado: "#dc2626",
  faltou: "#e11d48",
  quitado: "#0891b2",
};
const FALLBACK_COLOR = "#64748b";

export function StatusChart({ data }: { data: ServiceChannelSummaryItem[] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="Nenhum status de atendimento encontrado no período." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Bar dataKey="count" name="Quantidade" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLORS[entry.name.trim().toLowerCase()] ?? FALLBACK_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
