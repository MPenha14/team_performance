import { fetchSchedulesOfDay } from "../integrations/drclick.client";
import { getCached, setCached } from "../utils/memoryCache";
import { runWithConcurrency } from "../utils/concurrency";
import { listClinics } from "./clinics.service";
import { QueryFilters } from "./drclickQuery.service";

export interface ClinicBreakdownItem {
  clinicId: string;
  name: string;
  count: number;
}

function cacheKey(filters: { startDate: string; endDate: string }, userIds: string[]): string {
  const scope = [...userIds].sort().join(",");
  return `clinic-breakdown:${filters.startDate}:${filters.endDate}:${scope}`;
}

// Total de agendamentos (cons+exam+proc+ret) por unidade/clinica no
// periodo, somando SOMENTE os colaboradores informados (userIds) - os
// mesmos colaboradores cadastrados/ativos que alimentam o card
// "Agendamentos" do Dashboard, para os dois numeros baterem. Uma chamada
// por clinica (a API nao tem endpoint que ja devolva agrupado por
// clinica), mas em vez de usar o total da clinica inteira (mainSummary,
// que inclui todo mundo que atende la, nao so nossos colaboradores),
// filtra o roleStatement de cada clinica pelos userIds pedidos e soma so
// os deles - assim o total do grafico bate com o total do Dashboard.
export async function getClinicBreakdown(
  filters: QueryFilters,
  userIds: string[]
): Promise<ClinicBreakdownItem[]> {
  if (userIds.length === 0) return [];

  const key = cacheKey(filters, userIds);
  const cached = getCached<ClinicBreakdownItem[]>(key);
  if (cached) return cached;

  const idSet = new Set(userIds);
  const clinics = await listClinics();
  const results: ClinicBreakdownItem[] = [];

  await runWithConcurrency(clinics, 12, async (clinic) => {
    const response = await fetchSchedulesOfDay({
      start_date: filters.startDate,
      end_date: filters.endDate,
      idclinica: clinic.id,
    });

    let count = 0;
    for (const group of response.data.roleStatement) {
      for (const user of group.users) {
        if (!idSet.has(user.user_id)) continue;
        count += user.schedules.cons + user.schedules.exam + user.schedules.proc + user.schedules.ret;
      }
    }

    results.push({ clinicId: clinic.id, name: clinic.name, count });
  });

  results.sort((a, b) => b.count - a.count);

  setCached(key, results, 5 * 60 * 1000);
  return results;
}
