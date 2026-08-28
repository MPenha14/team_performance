import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { ChannelChart } from "../charts/ChannelChart";
import { OriginChart } from "../charts/OriginChart";
import { ScheduleDistributionChart } from "../charts/ScheduleDistributionChart";
import { RevenueTrendChart } from "../charts/RevenueTrendChart";
import { useFilters } from "../hooks/useFilters";
import { useEmployeeHistory, useEmployeePerformance } from "../hooks/usePerformance";
import { formatCurrency, formatNumber } from "../utils/format";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function EmployeeDetail() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const { data, isLoading, isError, error, refetch } = useEmployeePerformance(employeeId, filters);
  const { data: history } = useEmployeeHistory(employeeId, filters);

  return (
    <>
      <TopBar title="Performance Individual" subtitle="Detalhamento por colaborador" />

      <main className="flex-1 space-y-6 p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          ← Voltar para colaboradores
        </button>

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && data && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                  {data.employee.avatarUrl ? (
                    <img src={data.employee.avatarUrl} alt={data.employee.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(data.employee.name)
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{data.employee.name}</h2>
                  <p className="text-sm text-slate-500">{data.employee.role}</p>
                </div>
              </div>
              {data.employee.mappedAccounts.length === 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Nenhuma conta do Dr.Click mapeada — os indicadores ficarão zerados até o
                  mapeamento ser feito.
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <KpiCard label="Pacientes" value={formatNumber(data.employee.patients)} accent="blue" />
              <KpiCard label="Novos Pacientes" value={formatNumber(data.employee.newPatients)} accent="emerald" />
              <KpiCard label="Consultas" value={formatNumber(data.employee.consultations)} accent="violet" />
              <KpiCard label="Exames" value={formatNumber(data.employee.exams)} accent="amber" />
              <KpiCard label="Procedimentos" value={formatNumber(data.employee.procedures)} accent="rose" />
              <KpiCard label="Retornos" value={formatNumber(data.employee.returns)} accent="slate" />
              <KpiCard label="Combos" value={formatNumber(data.employee.combos)} accent="violet" />
              <KpiCard label="Faturamento" value={formatCurrency(data.employee.revenue)} accent="emerald" />
              {data.employee.team === "MIDIAS_SOCIAIS" && (
                <KpiCard
                  label="Recebimento Antecipado"
                  value={formatCurrency(data.employee.advancePayment)}
                  accent="emerald"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Distribuição de Agendamentos</h3>
                <ScheduleDistributionChart employee={data.employee} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Evolução do Faturamento</h3>
                <RevenueTrendChart data={history ?? []} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Canais de Atendimento (equipe/período)</h3>
                <ChannelChart data={data.channels} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">Origem de Atendimento (equipe/período)</h3>
                <OriginChart data={data.origins} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
