import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { useFilters } from "../hooks/useFilters";
import { usePerformance } from "../hooks/usePerformance";
import { EmployeePerformance } from "../types/drclick";
import { formatNumber, formatPercent } from "../utils/format";

type SortKey = "totalSchedules" | "attendedSchedules" | "conversionRate";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "totalSchedules", label: "Total de agendamentos" },
  { value: "attendedSchedules", label: "Agendamentos atendidos" },
  { value: "conversionRate", label: "Conversão" },
];

export function Performance() {
  const { filters } = useFilters();
  const { data, isLoading, isError, error, refetch } = usePerformance(filters);
  const [sortKey, setSortKey] = useState<SortKey>("conversionRate");
  const navigate = useNavigate();

  const ranked = useMemo<EmployeePerformance[]>(() => {
    const employees = data?.employees ?? [];
    return [...employees].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }, [data, sortKey]);

  return (
    <>
      <TopBar title="Performance" subtitle="Agendamentos, atendimentos e conversão por colaborador" />

      <main className="flex-1 space-y-6 p-6">
        <FilterBar onRefresh={() => refetch()} isRefreshing={isLoading} />

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Ordenar por</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="input w-auto"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}
        {!isLoading && !isError && ranked.length === 0 && <EmptyState />}

        {!isLoading && !isError && ranked.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3 text-right">Total de Agendamentos</th>
                    <th className="px-4 py-3 text-right">Agendamentos Atendidos</th>
                    <th className="px-4 py-3 text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranked.map((employee) => (
                    <tr
                      key={employee.employeeId}
                      onClick={() => navigate(`/colaboradores/${employee.employeeId}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.totalSchedules)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.attendedSchedules)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {employee.conversionRate !== null ? formatPercent(employee.conversionRate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
