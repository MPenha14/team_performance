import { fetchAppointmentsByStatus } from "../integrations/drclick.client";
import { getCached, setCached } from "../utils/memoryCache";
import { env } from "../config/env";
import { runWithConcurrency } from "../utils/concurrency";
import { QueryFilters } from "./drclickQuery.service";

export interface StatusBreakdown {
  count: number;
  revenue: number; // amount_bill_forecast oficial da API para esse status
}

function resolveFilters(filters: QueryFilters): Required<QueryFilters> {
  const clinicIds =
    filters.clinicIds && filters.clinicIds.length > 0 ? filters.clinicIds : env.drclick.clinicIds;
  return { startDate: filters.startDate, endDate: filters.endDate, clinicIds };
}

function userCacheKey(userId: string, filters: Required<QueryFilters>): string {
  return `attendance-user:${userId}:${filters.startDate}:${filters.endDate}:${filters.clinicIds.join(",")}`;
}

// Busca o breakdown de status (atendido, faltou, cancelado, etc.) de UM
// colaborador, via /appointmentbystatus?idusuario=X (sem filtro de canal) -
// uma chamada por colaborador, em paralelo. Chamar esse endpoint sem
// idusuario NEM idcanalatendimento para a clinica inteira trava (testado:
// >120s de timeout num periodo de 25 dias) porque a API teria que agregar
// todo mundo da clinica; filtrando por um usuario so a resposta fica
// pequena e rapida (~1-2s), igual ao /schedulesofday com "user=X".
async function fetchBreakdownForUser(
  userId: string,
  filters: Required<QueryFilters>
): Promise<Record<string, StatusBreakdown>> {
  const key = userCacheKey(userId, filters);
  const cached = getCached<Record<string, StatusBreakdown>>(key);
  if (cached) return cached;

  const response = await fetchAppointmentsByStatus({
    start_date: filters.startDate,
    end_date: filters.endDate,
    idclinica: filters.clinicIds.join(","),
    idusuario: userId,
  });

  const userResult = response.data.user_results.find((u) => u.user_id === userId);

  const breakdown: Record<string, StatusBreakdown> = {};
  for (const item of userResult?.services_by_status ?? []) {
    const status = item.name?.trim();
    if (!status) continue;
    const existing = breakdown[status] ?? { count: 0, revenue: 0 };
    existing.count += item.amount;
    existing.revenue += item.amount_bill_forecast ?? 0;
    breakdown[status] = existing;
  }

  setCached(key, breakdown, 5 * 60 * 1000);
  return breakdown;
}

// Retorna o breakdown de status para os user_ids pedidos (uma chamada por
// colaborador, em paralelo, limitada para nao sobrecarregar a API).
// Colaboradores sem nenhum registro no periodo ficam com breakdown vazio
// (nao e' erro - so nao tiveram atividade).
export async function getStatusBreakdowns(
  userIds: string[],
  filters: QueryFilters
): Promise<Map<string, Record<string, StatusBreakdown>>> {
  const resolved = resolveFilters(filters);
  const result = new Map<string, Record<string, StatusBreakdown>>();
  const uniqueIds = Array.from(new Set(userIds));

  await runWithConcurrency(uniqueIds, 8, async (userId) => {
    const breakdown = await fetchBreakdownForUser(userId, resolved);
    result.set(userId, breakdown);
  });

  return result;
}

// Igual a getStatusBreakdowns, mas retorna direto a quantidade de
// "atendido" por colaborador - usado na tela de Performance (conversao).
export async function getAttendedCounts(
  userIds: string[],
  filters: QueryFilters
): Promise<Map<string, number>> {
  const breakdowns = await getStatusBreakdowns(userIds, filters);
  const result = new Map<string, number>();

  for (const [userId, breakdown] of breakdowns) {
    const attended = Object.entries(breakdown).find(
      ([status]) => status.trim().toLowerCase() === "atendido"
    );
    result.set(userId, attended?.[1].count ?? 0);
  }

  return result;
}
