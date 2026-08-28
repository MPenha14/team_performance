import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { DateRangeBar } from "../components/DateRangeBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { StatusChart } from "../charts/StatusChart";
import { AppointmentTypeChart } from "../charts/AppointmentTypeChart";
import { useFilters } from "../hooks/useFilters";
import { useDashboardSummary } from "../hooks/useDashboard";
import { useSync } from "../hooks/useSync";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format";
import { Team } from "../types/employee";
import { TEAM_LABEL } from "../utils/team";

interface DashboardProps {
  team: Team;
}

export function Dashboard({ team }: DashboardProps) {
  const { filters } = useFilters();
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useDashboardSummary(filters, team);
  const sync = useSync();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleRefresh = async () => {
    await refetch();
    setLastUpdated(new Date());
  };

  const handleSyncNow = async () => {
    await sync.mutateAsync(filters);
    await handleRefresh();
  };

  const schedules = data?.schedules;
  const totalSchedules = schedules
    ? schedules.cons + schedules.exam + schedules.proc + schedules.ret
    : 0;
  const attendedSchedules = data?.attendedSchedules ?? 0;
  const attendedRevenue = data?.attendedRevenue ?? 0;
  const conversionRate = totalSchedules > 0 ? (attendedSchedules / totalSchedules) * 100 : 0;

  const findStatus = (name: string) =>
    data?.statusSummary.find((s) => s.name.trim().toLowerCase() === name);
  const missedStatus = findStatus("faltou");
  const canceledStatus = findStatus("cancelado");
  const missedSchedules = missedStatus?.count ?? 0;
  const canceledSchedules = canceledStatus?.count ?? 0;
  const missedRevenue = missedStatus?.revenue ?? 0;
  const canceledRevenue = canceledStatus?.revenue ?? 0;
  const advancePayment = data?.advancePayment ?? 0;
  const isMidiasSociais = team === "MIDIAS_SOCIAIS";

  return (
    <>
      <TopBar
        title="Media Performance"
        subtitle={`Performance de Agendamentos — Equipe ${TEAM_LABEL[team]}`}
        lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : lastUpdated}
      />

      <main className="flex-1 space-y-6 p-6">
        <DateRangeBar onRefresh={handleRefresh} isRefreshing={isLoading} />

        <div className="flex justify-end">
          <button
            onClick={handleSyncNow}
            disabled={sync.isPending}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {sync.isPending ? "Sincronizando..." : "Sincronizar agora"}
          </button>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && !schedules && <EmptyState />}

        {!isLoading && !isError && schedules && (
          <>
            <div
              className={
                isMidiasSociais
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7"
                  : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
              }
            >
              <KpiCard label="Agendamentos" value={formatNumber(totalSchedules)} accent="blue" />
              <KpiCard label="Agendamentos Atendidos" value={formatNumber(attendedSchedules)} accent="emerald" />
              <KpiCard label="Conversão" value={formatPercent(conversionRate)} accent="amber" />
              <KpiCard
                label="Faltosos"
                value={formatNumber(missedSchedules)}
                subLabel="Faturamento"
                subValue={formatCurrency(missedRevenue)}
                accent="rose"
              />
              <KpiCard
                label="Cancelados"
                value={formatNumber(canceledSchedules)}
                subLabel="Faturamento"
                subValue={formatCurrency(canceledRevenue)}
                accent="slate"
              />
              <KpiCard label="Faturamento dos Atendidos" value={formatCurrency(attendedRevenue)} accent="violet" />
              {isMidiasSociais && (
                <KpiCard
                  label="Recebimento Antecipado"
                  value={formatCurrency(advancePayment)}
                  accent="emerald"
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">Status de Atendimento</h2>
                <StatusChart data={data.statusSummary} />
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">Tipos de Atendimento</h2>
                <AppointmentTypeChart schedules={schedules} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
