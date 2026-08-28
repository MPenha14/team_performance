import { prisma } from "../utils/prisma";
import { getStatusBreakdowns } from "./attendance.service";
import { getAdvancePayments } from "./advancePayment.service";
import { ScheduleSummary, ServiceChannelSummaryItem } from "../types/drclick";
import { getSchedulesOfDayForUsers, QueryFilters } from "./drclickQuery.service";

export interface DashboardSummary {
  schedules: ScheduleSummary;
  attendedSchedules: number;
  // Faturamento previsto (amount_bill_forecast) dos agendamentos com status
  // "atendido" no periodo - valor oficial que a propria API do Dr.Click ja
  // calcula por status, nunca estimado aqui.
  attendedRevenue: number;
  statusSummary: ServiceChannelSummaryItem[];
  // Recebimento antecipado (total_amount_billed) somado de todos os
  // colaboradores - so calculado quando team === "MIDIAS_SOCIAIS" (0 para
  // Call Center, que nao usa esse indicador).
  advancePayment: number;
}

// O Dashboard mostra a soma dos colaboradores CADASTRADOS e ativos no Media
// Performance (uma chamada por conta Dr.Click mapeada, filtrada no servidor
// pelo parametro "user" de /schedulesofday - nao pelo canal de atendimento).
// Isso bate exatamente com os totais individuais que o Dr.Click mostra para
// cada colaborador, mesmo quando algum tem agendamentos fora do canal
// Telefonia (ex.: colaboradores de Supervisao).
export async function getDashboardSummary(
  filters: QueryFilters,
  team?: string
): Promise<DashboardSummary> {
  const mappings = await prisma.drClickMapping.findMany({
    where: { employee: { active: true, team: team || undefined } },
    select: { drclickUserId: true },
  });
  const userIds = mappings.map((m) => m.drclickUserId);

  const [userTotals, breakdowns, advanceByUser] = await Promise.all([
    getSchedulesOfDayForUsers(userIds, filters),
    getStatusBreakdowns(userIds, filters),
    team === "MIDIAS_SOCIAIS" ? getAdvancePayments(userIds, filters) : Promise.resolve(new Map<string, number>()),
  ]);

  const schedules: ScheduleSummary = { cons: 0, exam: 0, proc: 0, ret: 0 };
  for (const user of userTotals.values()) {
    schedules.cons += user.schedules.cons;
    schedules.exam += user.schedules.exam;
    schedules.proc += user.schedules.proc;
    schedules.ret += user.schedules.ret;
  }

  const statusTotals = new Map<string, { count: number; revenue: number }>();
  for (const breakdown of breakdowns.values()) {
    for (const [status, data] of Object.entries(breakdown)) {
      const existing = statusTotals.get(status) ?? { count: 0, revenue: 0 };
      existing.count += data.count;
      existing.revenue += data.revenue;
      statusTotals.set(status, existing);
    }
  }

  const statusSummary = Array.from(statusTotals.entries())
    .map(([name, v]) => ({ name, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count);

  const attendedStatus = statusSummary.find((s) => s.name.trim().toLowerCase() === "atendido");
  const attendedSchedules = attendedStatus?.count ?? 0;
  const attendedRevenue = attendedStatus?.revenue ?? 0;

  const advancePayment = Array.from(advanceByUser.values()).reduce((sum, v) => sum + v, 0);

  return { schedules, statusSummary, attendedSchedules, attendedRevenue, advancePayment };
}
