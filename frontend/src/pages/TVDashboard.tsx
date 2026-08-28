import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePerformance } from "../hooks/usePerformance";
import { useFilters } from "../hooks/useFilters";
import { formatCurrency, formatDateLabel, formatNumber } from "../utils/format";

const AUTO_REFRESH_MS = 15 * 60 * 1000;

export function TVDashboard() {
  const { filters } = useFilters();
  const { data, dataUpdatedAt, refetch } = usePerformance(filters);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => refetch(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const summary = data?.summary.mainSummary;
  const totalSchedules = summary
    ? summary.schedules.cons + summary.schedules.exam + summary.schedules.proc + summary.schedules.ret
    : 0;

  const topEmployees = [...(data?.employees ?? [])]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 p-10 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Media Performance</h1>
          <p className="text-lg text-slate-400">Performance de Agendamentos · Mais Saúde</p>
        </div>
        <div className="flex items-center gap-4">
          {dataUpdatedAt && (
            <span className="text-sm text-slate-400">
              Última atualização: {formatDateLabel(new Date(dataUpdatedAt))}
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          </button>
          <Link to="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Sair do modo TV
          </Link>
        </div>
      </div>

      {summary && (
        <>
          <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            <TvCard label="Agendamentos" value={formatNumber(totalSchedules)} />
            <TvCard label="Pacientes" value={formatNumber(summary.patients)} />
            <TvCard label="Novos Pacientes" value={formatNumber(summary.newPatients)} />
            <TvCard label="Faturamento" value={formatCurrency(summary.revenue)} />
            <TvCard label="Consultas" value={formatNumber(summary.schedules.cons)} />
            <TvCard label="Exames" value={formatNumber(summary.schedules.exam)} />
            <TvCard label="Procedimentos" value={formatNumber(summary.schedules.proc)} />
            <TvCard label="Retornos" value={formatNumber(summary.schedules.ret)} />
          </div>

          <div className="rounded-3xl bg-slate-900 p-8">
            <h2 className="mb-6 text-2xl font-semibold text-slate-200">Top Colaboradores</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topEmployees.map((employee, index) => (
                <div key={employee.employeeId} className="flex items-center justify-between rounded-2xl bg-slate-800 px-6 py-4">
                  <div>
                    <p className="text-lg font-semibold">{index + 1}º {employee.name}</p>
                    <p className="text-sm text-slate-400">{employee.role}</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(employee.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TvCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-900 p-6 text-center">
      <p className="text-lg uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-5xl font-bold">{value}</p>
    </div>
  );
}
