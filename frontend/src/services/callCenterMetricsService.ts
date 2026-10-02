import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { CallCenterMonthlyMetric } from "../types/callCenterMetrics";

export async function fetchMetricsHistory(): Promise<CallCenterMonthlyMetric[]> {
  const { data } = await api.get<ApiEnvelope<CallCenterMonthlyMetric[]>>("/call-center-metrics");
  return data.data;
}

export async function fetchMonthlyMetric(month: string): Promise<CallCenterMonthlyMetric> {
  const { data } = await api.get<ApiEnvelope<CallCenterMonthlyMetric>>(`/call-center-metrics/${month}`);
  return data.data;
}

export async function updateMonthlyMetric(
  month: string,
  input: { offeredCalls: number; answeredCalls: number; voxiaScore: number | null }
): Promise<CallCenterMonthlyMetric> {
  const { data } = await api.put<ApiEnvelope<CallCenterMonthlyMetric>>(
    `/call-center-metrics/${month}`,
    input
  );
  return data.data;
}
