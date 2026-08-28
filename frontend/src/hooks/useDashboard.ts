import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "../services/dashboardService";
import { GlobalFilters } from "./useFilters";
import { Team } from "../types/employee";

const AUTO_REFRESH_MS = 15 * 60 * 1000;

export function useDashboardSummary(filters: GlobalFilters, team: Team) {
  return useQuery({
    queryKey: ["dashboard", filters, team],
    queryFn: () => fetchDashboardSummary(filters, team),
    refetchInterval: AUTO_REFRESH_MS,
    staleTime: 60 * 1000,
  });
}
