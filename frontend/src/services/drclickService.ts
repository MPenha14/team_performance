import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { DrClickDirectoryUser, SyncLogEntry } from "../types/employee";
import { GlobalFilters } from "../hooks/useFilters";

// Lista bruta de usuarios retornados pela API do Dr.Click (roleStatement)
// para o periodo/clinicas informados - inclui contas que nao sao
// colaboradores reais (bots/sistema). Usada apenas na tela de mapeamento,
// para o admin escolher a qual colaborador cadastrado cada conta pertence.
export async function fetchDrClickUsers(filters: GlobalFilters): Promise<DrClickDirectoryUser[]> {
  const { data } = await api.get<ApiEnvelope<DrClickDirectoryUser[]>>("/users", {
    params: {
      start_date: filters.startDate,
      end_date: filters.endDate,
      idclinica: filters.clinicIds.length > 0 ? filters.clinicIds.join(",") : undefined,
    },
  });
  return data.data;
}

export async function fetchSyncLogs(limit = 50): Promise<SyncLogEntry[]> {
  const { data } = await api.get<ApiEnvelope<SyncLogEntry[]>>("/sync/logs", { params: { limit } });
  return data.data;
}
