import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMetricsHistory, fetchMonthlyMetric, updateMonthlyMetric } from "../services/callCenterMetricsService";
import { CallCenterMonthlyMetric } from "../types/callCenterMetrics";

export function useMetricsHistory() {
  return useQuery({
    queryKey: ["call-center-metrics", "history"],
    queryFn: fetchMetricsHistory,
  });
}

export function useMonthlyMetric(month: string) {
  return useQuery({
    queryKey: ["call-center-metrics", "month", month],
    queryFn: () => fetchMonthlyMetric(month),
    enabled: Boolean(month),
  });
}

export function useUpdateMonthlyMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      month,
      ...input
    }: { month: string } & Pick<CallCenterMonthlyMetric, "offeredCalls" | "answeredCalls" | "voxiaScore">) =>
      updateMonthlyMetric(month, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-center-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
