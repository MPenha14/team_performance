import { TopBar } from "../components/TopBar";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { useFilters } from "../hooks/useFilters";
import { usePerformance } from "../hooks/usePerformance";
import { fetchSchedules } from "../services/performanceService";
import { downloadCsv } from "../utils/exportCsv";
import { formatDateTime } from "../utils/format";

export function Reports() {
  const { filters } = useFilters();
  const { data, isLoading, isError, error, refetch } = usePerformance(filters);

  const handleExportPerformance = () => {
    if (!data) return;
    downloadCsv(
      `performance_${filters.startDate}_${filters.endDate}.csv`,
      [
        "Colaborador",
        "Cargo",
        "Pacientes",
        "Novos Pacientes",
        "Consultas",
        "Exames",
        "Procedimentos",
        "Retornos",
        "Total de Agendamentos",
        "Combos",
        "Faturamento",
      ],
      data.employees.map((e) => [
        e.name,
        e.role,
        e.patients,
        e.newPatients,
        e.consultations,
        e.exams,
        e.procedures,
        e.returns,
        e.totalSchedules,
        e.combos,
        e.revenue,
      ])
    );
  };

  const handleExportSchedules = async () => {
    const result = await fetchSchedules(filters, { pageSize: 10000, page: 1 });
    downloadCsv(
      `agendamentos_detalhado_${filters.startDate}_${filters.endDate}.csv`,
      ["Status", "Data/Hora", "Paciente", "Profissional", "Especialidade", "Serviço", "Convênio", "Valor"],
      result.items.map((item) => [
        item.statusText || item.status,
        formatDateTime(item.scheduleDate),
        item.patient,
        item.professional,
        item.category,
        item.service,
        item.convenio,
        item.value,
      ])
    );
  };

  return (
    <>
      <TopBar title="Relatórios" subtitle="Exportação de dados em Excel/CSV" />

      <main className="flex-1 space-y-6 p-6">
        <FilterBar onRefresh={() => refetch()} isRefreshing={isLoading} />

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}
        {!isLoading && !isError && (data?.employees.length ?? 0) === 0 && <EmptyState />}

        {!isLoading && !isError && data && data.employees.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
              <h3 className="text-sm font-semibold text-slate-800">Performance por Colaborador</h3>
              <p className="mt-1 text-xs text-slate-500">
                Colaborador, cargo, pacientes, novos pacientes, consultas, exames, procedimentos,
                retornos, total de agendamentos, combos e faturamento.
              </p>
              <button
                onClick={handleExportPerformance}
                className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Exportar CSV
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
              <h3 className="text-sm font-semibold text-slate-800">Detalhamento de Agendamentos</h3>
              <p className="mt-1 text-xs text-slate-500">
                Todos os registros do período/clínicas selecionados, exatamente como retornados pela
                API do Dr.Click.
              </p>
              <button
                onClick={handleExportSchedules}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Exportar CSV
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
