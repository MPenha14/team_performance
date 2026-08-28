import { api } from "./api";
import { ApiEnvelope, ScheduleSummary, ServiceChannelSummaryItem } from "../types/drclick";
import { GlobalFilters } from "../hooks/useFilters";

export interface DashboardSummary {
  schedules: ScheduleSummary;
  attendedSchedules: number;
  attendedRevenue: number;
  statusSummary: ServiceChannelSummaryItem[];
}

// Dashboard restrito ao cargo "TELEFONIA" (equipe de Midias e Call Center) -
// endpoint proprio, separado de /api/performance, que continua mostrando
// todos os cargos nas telas de Colaboradores/Ranking/Performance.
export async function fetchDashboardSummary(filters: GlobalFilters): Promise<DashboardSummary> {
  const { data } = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard", {
    params: {
      start_date: filters.startDate,
      end_date: filters.endDate,
      idclinica: filters.clinicIds.length > 0 ? filters.clinicIds.join(",") : undefined,
    },
  });
  return data.data;
}
