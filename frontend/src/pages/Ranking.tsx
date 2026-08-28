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
import { formatCurrency, formatNumber } from "../utils/format";
import { Team } from "../types/employee";
import { TEAM_LABEL, TEAM_SLUG } from "../utils/team";

type SortKey = "revenue" | "consultations" | "exams" | "totalSchedules" | "patients" | "advancePayment";

const BASE_SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "revenue", label: "Faturamento" },
  { value: "consultations", label: "Consultas" },
  { value: "exams", label: "Exames" },
  { value: "totalSchedules", label: "Total de agendamentos" },
  { value: "patients", label: "Pacientes" },
];

const ADVANCE_PAYMENT_SORT_OPTION: { value: SortKey; label: string } = {
  value: "advancePayment",
  label: "Recebimento Antecipado",
};

interface RankingProps {
  team: Team;
}

export function Ranking({ team }: RankingProps) {
  const { filters } = useFilters();
  const { data, isLoading, isError, error, refetch } = usePerformance(filters, team);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const navigate = useNavigate();
  const isMidiasSociais = team === "MIDIAS_SOCIAIS";
  const sortOptions = isMidiasSociais ? [...BASE_SORT_OPTIONS, ADVANCE_PAYMENT_SORT_OPTION] : BASE_SORT_OPTIONS;

  const ranked = useMemo<EmployeePerformance[]>(() => {
    const employees = data?.employees ?? [];
    return [...employees].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [data, sortKey]);

  return (
    <>
      <TopBar
        title={`Ranking de Performance — ${TEAM_LABEL[team]}`}
        subtitle="Classificação dos colaboradores no período selecionado"
      />

      <main className="flex-1 space-y-6 p-6">
        <FilterBar onRefresh={() => refetch()} isRefreshing={isLoading} team={team} />

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Ordenar por</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="input w-auto"
          >
            {sortOptions.map((option) => (
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
              <table className={isMidiasSociais ? "w-full min-w-[1250px] text-left text-sm" : "w-full min-w-[1050px] text-left text-sm"}>
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Posição</th>
                    <th className="px-4 py-3">Colaborador</th>
                    <th className="px-4 py-3">Cargo</th>
                    <th className="px-4 py-3 text-right">Pacientes</th>
                    <th className="px-4 py-3 text-right">Consultas</th>
                    <th className="px-4 py-3 text-right">Exames</th>
                    <th className="px-4 py-3 text-right">Procedimentos</th>
                    <th className="px-4 py-3 text-right">Retornos</th>
                    <th className="px-4 py-3 text-right">Total de Agendamentos</th>
                    <th className="px-4 py-3 text-right">Combos</th>
                    <th className="px-4 py-3 text-right">Faturamento</th>
                    {isMidiasSociais && (
                      <th className="px-4 py-3 text-right">Recebimento Antecipado</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ranked.map((employee, index) => (
                    <tr
                      key={employee.employeeId}
                      onClick={() => navigate(`/${TEAM_SLUG[team]}/colaboradores/${employee.employeeId}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}º</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                      <td className="px-4 py-3 text-slate-500">{employee.role}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.patients)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.consultations)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.exams)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.procedures)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.returns)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatNumber(employee.totalSchedules)}
                      </td>
                      <td className="px-4 py-3 text-right">{formatNumber(employee.combos)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {formatCurrency(employee.revenue)}
                      </td>
                      {isMidiasSociais && (
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          {formatCurrency(employee.advancePayment)}
                        </td>
                      )}
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
