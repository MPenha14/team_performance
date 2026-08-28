import { api } from "./api";
import {
  ApiEnvelope,
  ClinicInfo,
  HistoryPoint,
  PaginatedSchedules,
  PerformanceDetailResponse,
  PerformanceListResponse,
} from "../types/drclick";
import { GlobalFilters } from "../hooks/useFilters";
import { Team } from "../types/employee";

function buildParams(filters: GlobalFilters, extra: Record<string, string | number | undefined> = {}) {
  const params: Record<string, string | number> = {
    start_date: filters.startDate,
    end_date: filters.endDate,
  };

  if (filters.clinicIds.length > 0) {
    params.idclinica = filters.clinicIds.join(",");
  }
  if (filters.role) {
    params.role = filters.role;
  }
  if (filters.employeeId) {
    params.employee_id = filters.employeeId;
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") {
      params[key] = value;
    }
  }

  return params;
}

export async function fetchPerformance(
  filters: GlobalFilters,
  team?: Team
): Promise<PerformanceListResponse> {
  const { data } = await api.get<ApiEnvelope<PerformanceListResponse>>("/performance", {
    params: buildParams(filters, { team }),
  });
  return data.data;
}

export async function fetchPerformanceById(
  employeeId: string,
  filters: GlobalFilters
): Promise<PerformanceDetailResponse> {
  const { data } = await api.get<ApiEnvelope<PerformanceDetailResponse>>(
    `/performance/${employeeId}`,
    { params: buildParams(filters) }
  );
  return data.data;
}

export async function fetchPerformanceHistory(
  employeeId: string,
  filters: GlobalFilters
): Promise<HistoryPoint[]> {
  const { data } = await api.get<ApiEnvelope<HistoryPoint[]>>(
    `/performance/${employeeId}/history`,
    { params: { start_date: filters.startDate, end_date: filters.endDate } }
  );
  return data.data;
}

export interface SchedulesQueryOptions {
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function fetchSchedules(
  filters: GlobalFilters,
  options: SchedulesQueryOptions = {}
): Promise<PaginatedSchedules> {
  const { data } = await api.get<ApiEnvelope<PaginatedSchedules>>("/schedules", {
    params: buildParams(filters, { ...options }),
  });
  return data.data;
}

export async function fetchClinics(): Promise<ClinicInfo[]> {
  const { data } = await api.get<ApiEnvelope<ClinicInfo[]>>("/clinics");
  return data.data;
}

export async function triggerSync(filters: GlobalFilters): Promise<void> {
  await api.post("/sync", {
    start_date: filters.startDate,
    end_date: filters.endDate,
    clinic_ids: filters.clinicIds.length > 0 ? filters.clinicIds : undefined,
  });
}
