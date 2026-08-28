import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "../services/dashboardService";
import { GlobalFilters } from "./useFilters";

const AUTO_REFRESH_MS = 15 * 60 * 1000;

export function useDashboardSummary(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => fetchDashboardSummary(filters),
    refetchInterval: AUTO_REFRESH_MS,
    staleTime: 60 * 1000,
  });
}
