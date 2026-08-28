import { useQuery } from "@tanstack/react-query";
import {
  fetchPerformance,
  fetchPerformanceById,
  fetchPerformanceHistory,
} from "../services/performanceService";
import { GlobalFilters } from "./useFilters";

const AUTO_REFRESH_MS = 15 * 60 * 1000; // 15 minutos

export function usePerformance(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["performance", filters],
    queryFn: () => fetchPerformance(filters),
    refetchInterval: AUTO_REFRESH_MS,
    staleTime: 60 * 1000,
  });
}

export function useEmployeePerformance(employeeId: string | undefined, filters: GlobalFilters) {
  return useQuery({
    queryKey: ["performance", employeeId, filters],
    queryFn: () => fetchPerformanceById(employeeId as string, filters),
    enabled: Boolean(employeeId),
    refetchInterval: AUTO_REFRESH_MS,
    staleTime: 60 * 1000,
  });
}

export function useEmployeeHistory(employeeId: string | undefined, filters: GlobalFilters) {
  return useQuery({
    queryKey: ["performance-history", employeeId, filters.startDate, filters.endDate],
    queryFn: () => fetchPerformanceHistory(employeeId as string, filters),
    enabled: Boolean(employeeId),
    staleTime: 60 * 1000,
  });
}
