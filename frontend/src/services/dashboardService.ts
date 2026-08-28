import { api } from "./api";
import { ApiEnvelope, ScheduleSummary, ServiceChannelSummaryItem } from "../types/drclick";
import { GlobalFilters } from "../hooks/useFilters";
import { Team } from "../types/employee";

export interface DashboardSummary {
  schedules: ScheduleSummary;
  attendedSchedules: number;
  attendedRevenue: number;
  statusSummary: ServiceChannelSummaryItem[];
  advancePayment: number;
}

// Soma os colaboradores cadastrados/ativos da equipe informada (CALL_CENTER
// ou MIDIAS_SOCIAIS).
export async function fetchDashboardSummary(
  filters: GlobalFilters,
  team: Team
): Promise<DashboardSummary> {
  const { data } = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard", {
    params: {
      start_date: filters.startDate,
      end_date: filters.endDate,
      idclinica: filters.clinicIds.length > 0 ? filters.clinicIds.join(",") : undefined,
      team,
    },
  });
  return data.data;
}
