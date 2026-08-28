import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ScheduleSummary } from "../types/drclick";

const TYPE_COLORS = ["#2563eb", "#7c3aed", "#d97706", "#059669"];

// Tipos de atendimento (Consulta/Exame/Procedimento/Retorno) - os mesmos
// numeros oficiais de schedules.cons/exam/proc/ret usados nos cards do
// Dashboard, so que quebrados em grafico.
export function AppointmentTypeChart({ schedules }: { schedules: ScheduleSummary }) {
  const data = [
    { name: "Consultas", value: schedules.cons },
    { name: "Exames", value: schedules.exam },
    { name: "Procedimentos", value: schedules.proc },
    { name: "Retornos", value: schedules.ret },
  ];

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
        <Bar dataKey="value" name="Quantidade" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
