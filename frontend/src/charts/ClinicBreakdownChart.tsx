import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ClinicBreakdownItem } from "../types/drclick";
import { EmptyState } from "../components/EmptyState";
import { formatNumber } from "../utils/format";

// Paleta categorica (8 matizes fixas, ordem fixa - nunca ciclada). Mostra
// cada unidade real individualmente (dado concreto, sem agrupar em
// "Outras"); so agrupa o excedente se um dia houver mais de 8 unidades
// ativas ao mesmo tempo, para nao esgotar a paleta de identidade.
const COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];
const OTHERS_COLOR = "#94a3b8";
const MAX_NAMED_SLICES = 8;

interface PieDatum {
  name: string;
  count: number;
  color: string;
}

function buildPieData(data: ClinicBreakdownItem[]): PieDatum[] {
  const withActivity = data.filter((item) => item.count > 0);
  const named = withActivity.slice(0, MAX_NAMED_SLICES);
  const rest = withActivity.slice(MAX_NAMED_SLICES);
  const restTotal = rest.reduce((sum, item) => sum + item.count, 0);

  const result: PieDatum[] = named.map((item, index) => ({
    name: item.name,
    count: item.count,
    color: COLORS[index],
  }));

  if (restTotal > 0) {
    result.push({ name: "Outras unidades", count: restTotal, color: OTHERS_COLOR });
  }

  return result;
}

export function ClinicBreakdownChart({ data }: { data: ClinicBreakdownItem[] }) {
  const pieData = buildPieData(data ?? []);
  const total = pieData.reduce((sum, item) => sum + item.count, 0);

  if (pieData.length === 0 || total === 0) {
    return <EmptyState message="Nenhum agendamento encontrado por unidade no período." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {pieData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="#fcfcfb" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${formatNumber(value)} agendamentos (${((value / total) * 100).toFixed(1)}%)`,
            name,
          ]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
