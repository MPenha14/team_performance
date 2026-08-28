import { env } from "../config/env";
import { fetchSchedulesOfDay } from "../integrations/drclick.client";
import { RoleStatementUser, SchedulesOfDayData } from "../types/drclick";
import { getCached, setCached } from "../utils/memoryCache";
import { AppError } from "../utils/AppError";
import { runWithConcurrency } from "../utils/concurrency";

export interface QueryFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  clinicIds?: string[]; // se omitido, usa todas as clinicas configuradas
}

function validateDate(label: string, value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(
      `Parametro invalido: ${label} deve estar no formato AAAA-MM-DD.`,
      400
    );
  }
}

function resolveClinicIds(filters: QueryFilters): string[] {
  const clinicIds =
    filters.clinicIds && filters.clinicIds.length > 0
      ? filters.clinicIds
      : env.drclick.clinicIds;

  if (clinicIds.length === 0) {
    throw new AppError(
      "Nenhuma clinica configurada. Defina DRCLICK_CLINIC_IDS no servidor.",
      500
    );
  }

  return clinicIds;
}

function cacheKey(filters: Required<QueryFilters>): string {
  return `schedulesofday:${filters.startDate}:${filters.endDate}:${filters.clinicIds.join(",")}:${env.drclick.telefoniaChannelId}`;
}

// Busca os dados brutos do Dr.Click para o periodo/clinicas informados.
// Sistema restrito ao canal de atendimento Telefonia (equipe de Midias e
// Call Center) - o filtro idcanalatendimento e' aplicado aqui, no unico
// lugar que monta a chamada para /schedulesofday, entao TODAS as telas
// (Dashboard, Performance, Ranking, Colaboradores, Agendamentos) recebem
// apenas os dados desse canal direto da API, sem precisar filtrar/agregar
// depois - o payload cai de ~9MB para ~300KB por dia.
// Usa cache em memoria para evitar chamadas repetidas em curto intervalo.
export async function getSchedulesOfDay(
  filters: QueryFilters,
  options: { bypassCache?: boolean } = {}
): Promise<SchedulesOfDayData> {
  validateDate("start_date", filters.startDate);
  validateDate("end_date", filters.endDate);

  const clinicIds = resolveClinicIds(filters);

  const resolved: Required<QueryFilters> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    clinicIds,
  };

  const key = cacheKey(resolved);

  if (!options.bypassCache) {
    const cached = getCached<SchedulesOfDayData>(key);
    if (cached) {
      return cached;
    }
  }

  const response = await fetchSchedulesOfDay({
    start_date: resolved.startDate,
    end_date: resolved.endDate,
    idclinica: clinicIds.join(","),
    idcanalatendimento: env.drclick.telefoniaChannelId || undefined,
  });

  if (!response.success) {
    throw new AppError(
      "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.",
      502
    );
  }

  setCached(key, response.data);

  return response.data;
}

function userCacheKey(userId: string, filters: Required<QueryFilters>): string {
  return `schedulesofday-user:${userId}:${filters.startDate}:${filters.endDate}:${filters.clinicIds.join(",")}`;
}

// Busca os agendamentos de UM colaborador especifico (todos os canais),
// usando o parametro "user" do /schedulesofday - filtra no servidor, entao
// o payload fica pequeno (so os registros desse colaborador) mesmo sem
// filtro de canal. Usado para colaboradores cadastrados no Media
// Performance quando se quer o total exato dele (identico ao que o
// Dr.Click mostra), sem depender do canal de atendimento classificado
// pelo Dr.Click para cada agendamento. Retorna a resposta completa (inclui
// summary.serviceChannelSummary/serviceOriginSummary ja escopados a esse
// colaborador), nao so o total.
export async function getSchedulesOfDayForUser(
  userId: string,
  filters: QueryFilters
): Promise<SchedulesOfDayData> {
  validateDate("start_date", filters.startDate);
  validateDate("end_date", filters.endDate);

  const clinicIds = resolveClinicIds(filters);
  const resolved: Required<QueryFilters> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    clinicIds,
  };

  const key = userCacheKey(userId, resolved);
  const cached = getCached<SchedulesOfDayData>(key);
  if (cached) {
    return cached;
  }

  const response = await fetchSchedulesOfDay({
    start_date: resolved.startDate,
    end_date: resolved.endDate,
    idclinica: clinicIds.join(","),
    user: userId,
  });

  if (!response.success) {
    throw new AppError(
      "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.",
      502
    );
  }

  setCached(key, response.data);

  return response.data;
}

export function extractUserTotals(data: SchedulesOfDayData, userId: string): RoleStatementUser | null {
  return data.roleStatement.flatMap((group) => group.users).find((u) => u.user_id === userId) ?? null;
}

// Mesma coisa que getSchedulesOfDayForUser, mas para varios colaboradores
// de uma vez (chamadas em paralelo, limitadas para nao sobrecarregar a API)
// - retorna so o total de cada um (nao a resposta completa, para nao gastar
// memoria a toa quando so o agregado interessa, ex.: Dashboard).
export async function getSchedulesOfDayForUsers(
  userIds: string[],
  filters: QueryFilters
): Promise<Map<string, RoleStatementUser>> {
  const result = new Map<string, RoleStatementUser>();
  const uniqueIds = Array.from(new Set(userIds));

  await runWithConcurrency(uniqueIds, 8, async (userId) => {
    const data = await getSchedulesOfDayForUser(userId, filters);
    const user = extractUserTotals(data, userId);
    if (user) {
      result.set(userId, user);
    }
  });

  return result;
}
