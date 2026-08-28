import { prisma } from "../utils/prisma";
import { listDaysBetween } from "../utils/dateRange";
import { ServiceChannelSummaryItem, ServiceOriginSummaryItem } from "../types/drclick";

// Serve consultas de periodos JA TOTALMENTE SINCRONIZADOS direto do banco,
// somando os totais diarios exatos que a API ja retornou em cada
// sincronizacao (DailyMetrics/PerformanceSnapshot/ServiceChannel/
// ServiceOrigin) em vez de chamar a API ao vivo. Nenhum numero e
// recalculado ou estimado - e' sempre soma de totais diarios oficiais.
//
// So e' usado quando TODOS os dias do periodo pedido tem uma sincronizacao
// bem-sucedida cobrindo exatamente as mesmas clinicas solicitadas; caso
// contrario o chamador deve cair para a API ao vivo (ver drclickQuery
// .service.ts / performance.service.ts).

export interface CachedTotals {
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  patients: number;
  newPatients: number;
  revenue: number;
  combos: number;
  attendedSchedules: number;
  totalSchedules: number;
}

export interface UserTotals {
  patients: number;
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  combos: number;
  revenue: number;
  serviceorderAmount: number;
  serviceorderBilled: number;
  amountPlan: number;
}

function clinicKey(clinicIds: string[]): string {
  return clinicIds.join(",");
}

function toRangeDates(startDate: string, endDate: string) {
  return {
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  };
}

// Verifica se TODOS os dias do periodo pedido ja foram sincronizados com
// exatamente o mesmo conjunto de clinicas.
export async function isRangeCached(
  startDate: string,
  endDate: string,
  clinicIds: string[]
): Promise<boolean> {
  const days = listDaysBetween(startDate, endDate);
  if (days.length === 0) return false;

  const { start, end } = toRangeDates(startDate, endDate);
  const rows = await prisma.dailyMetrics.findMany({
    where: { clinicIds: clinicKey(clinicIds), date: { gte: start, lte: end } },
    select: { date: true },
  });

  const covered = new Set(rows.map((row) => row.date.toISOString().slice(0, 10)));
  return days.every((day) => covered.has(day));
}

export async function getCachedTotals(
  startDate: string,
  endDate: string,
  clinicIds: string[]
): Promise<CachedTotals> {
  const { start, end } = toRangeDates(startDate, endDate);

  const rows = await prisma.dailyMetrics.findMany({
    where: { clinicIds: clinicKey(clinicIds), date: { gte: start, lte: end } },
  });

  return rows.reduce<CachedTotals>(
    (acc, row) => ({
      consultations: acc.consultations + row.consultations,
      exams: acc.exams + row.exams,
      procedures: acc.procedures + row.procedures,
      returns: acc.returns + row.returns,
      patients: acc.patients + row.patients,
      newPatients: acc.newPatients + row.newPatients,
      revenue: acc.revenue + Number(row.revenue),
      combos: acc.combos + row.combos,
      attendedSchedules: acc.attendedSchedules + row.attendedSchedules,
      totalSchedules: acc.totalSchedules + row.totalSchedules,
    }),
    {
      consultations: 0,
      exams: 0,
      procedures: 0,
      returns: 0,
      patients: 0,
      newPatients: 0,
      revenue: 0,
      combos: 0,
      attendedSchedules: 0,
      totalSchedules: 0,
    }
  );
}

export async function getCachedChannels(
  startDate: string,
  endDate: string
): Promise<ServiceChannelSummaryItem[]> {
  const { start, end } = toRangeDates(startDate, endDate);
  const rows = await prisma.serviceChannel.groupBy({
    by: ["name"],
    where: { startDate: { gte: start }, endDate: { lte: end } },
    _sum: { count: true },
  });
  return rows
    .map((row) => ({ name: row.name, count: row._sum.count ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export async function getCachedOrigins(
  startDate: string,
  endDate: string
): Promise<ServiceOriginSummaryItem[]> {
  const { start, end } = toRangeDates(startDate, endDate);
  const rows = await prisma.serviceOrigin.groupBy({
    by: ["name"],
    where: { startDate: { gte: start }, endDate: { lte: end } },
    _sum: { count: true },
  });
  return rows
    .map((row) => ({ name: row.name, count: row._sum.count ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

// Contagem de agendamentos por status (Confirmado, Faltou, Cancelado,
// Atendido, etc.) somando o statusBreakdown gravado em cada dia
// sincronizado. Usado no grafico "Status de Atendimento" do Dashboard.
export async function getCachedStatusSummary(
  startDate: string,
  endDate: string,
  clinicIds: string[]
): Promise<ServiceChannelSummaryItem[]> {
  const { start, end } = toRangeDates(startDate, endDate);
  const rows = await prisma.dailyMetrics.findMany({
    where: { clinicIds: clinicKey(clinicIds), date: { gte: start, lte: end } },
    select: { statusBreakdown: true },
  });

  const totals = new Map<string, number>();
  for (const row of rows) {
    const breakdown = row.statusBreakdown as Record<string, number>;
    for (const [status, count] of Object.entries(breakdown ?? {})) {
      totals.set(status, (totals.get(status) ?? 0) + count);
    }
  }

  return Array.from(totals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// Totais por colaborador (Dr.Click user_id), somando os snapshots diarios
// do periodo. Usado para reconstruir o roleStatement a partir do banco.
export async function getCachedUserTotals(
  startDate: string,
  endDate: string
): Promise<Map<string, UserTotals>> {
  const { start, end } = toRangeDates(startDate, endDate);
  const snapshots = await prisma.performanceSnapshot.findMany({
    where: { startDate: { gte: start }, endDate: { lte: end } },
  });

  const map = new Map<string, UserTotals>();

  for (const snapshot of snapshots) {
    const existing = map.get(snapshot.userId) ?? {
      patients: 0,
      consultations: 0,
      exams: 0,
      procedures: 0,
      returns: 0,
      combos: 0,
      revenue: 0,
      serviceorderAmount: 0,
      serviceorderBilled: 0,
      amountPlan: 0,
    };

    existing.patients += snapshot.patients;
    existing.consultations += snapshot.consultations;
    existing.exams += snapshot.exams;
    existing.procedures += snapshot.procedures;
    existing.returns += snapshot.returns;
    existing.combos += snapshot.combos;
    existing.revenue += Number(snapshot.revenue);
    existing.serviceorderAmount += Number(snapshot.serviceorderAmount);
    existing.serviceorderBilled += Number(snapshot.serviceorderBilled);
    existing.amountPlan += Number(snapshot.amountPlan);

    map.set(snapshot.userId, existing);
  }

  return map;
}
