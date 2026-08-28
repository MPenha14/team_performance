import { useQuery } from "@tanstack/react-query";
import { fetchDrClickUsers, fetchSyncLogs } from "../services/drclickService";
import { GlobalFilters } from "./useFilters";

export function useDrClickUsers(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["drclick-users", filters.startDate, filters.endDate, filters.clinicIds],
    queryFn: () => fetchDrClickUsers(filters),
    staleTime: 60 * 1000,
  });
}

export function useSyncLogs() {
  return useQuery({
    queryKey: ["sync-logs"],
    queryFn: () => fetchSyncLogs(),
    staleTime: 15 * 1000,
  });
}
