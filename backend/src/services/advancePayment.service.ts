import { env } from "../config/env";
import { fetchUsersPerformance } from "../integrations/drclick.client";
import { getCached, setCached } from "../utils/memoryCache";
import { runWithConcurrency } from "../utils/concurrency";
import { QueryFilters } from "./drclickQuery.service";

function resolveFilters(filters: QueryFilters): Required<QueryFilters> {
  const clinicIds =
    filters.clinicIds && filters.clinicIds.length > 0 ? filters.clinicIds : env.drclick.clinicIds;
  return { startDate: filters.startDate, endDate: filters.endDate, clinicIds };
}

function userCacheKey(userId: string, filters: Required<QueryFilters>): string {
  return `advance-payment-user:${userId}:${filters.startDate}:${filters.endDate}:${filters.clinicIds.join(",")}`;
}

// Recebimento antecipado (total_amount_billed) de UM colaborador, via
// /api/reports/users-performance?idusuario=X - so faz sentido para
// colaboradores de Midias Sociais/Comercial (o Call Center nao usa esse
// endpoint).
async function fetchAdvancePaymentForUser(
  userId: string,
  filters: Required<QueryFilters>
): Promise<number> {
  const key = userCacheKey(userId, filters);
  const cached = getCached<number>(key);
  if (cached !== undefined) return cached;

  const response = await fetchUsersPerformance({
    idclinica: filters.clinicIds.join(","),
    idusuario: userId,
    start_date: filters.startDate,
    end_date: filters.endDate,
    page: 1,
    limit: 999,
  });

  const total = response.data.groupByRoleResponse.reduce(
    (sum, group) => sum + (group.total_amount_billed ?? 0),
    0
  );

  setCached(key, total, 5 * 60 * 1000);
  return total;
}

// Retorna o recebimento antecipado por colaborador (uma chamada por
// colaborador, em paralelo, limitada para nao sobrecarregar a API).
export async function getAdvancePayments(
  userIds: string[],
  filters: QueryFilters
): Promise<Map<string, number>> {
  const resolved = resolveFilters(filters);
  const result = new Map<string, number>();
  const uniqueIds = Array.from(new Set(userIds));

  await runWithConcurrency(uniqueIds, 8, async (userId) => {
    const total = await fetchAdvancePaymentForUser(userId, resolved);
    result.set(userId, total);
  });

  return result;
}
