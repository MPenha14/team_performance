import { randomUUID } from "crypto";
import { prisma } from "../utils/prisma";
import { env } from "../config/env";
import { getSchedulesOfDay } from "./drclickQuery.service";
import { logger } from "../utils/logger";
import { invalidateCache } from "../utils/memoryCache";
import { listDaysBetween } from "../utils/dateRange";
import { runWithConcurrency } from "../utils/concurrency";
import { RoleStatementUser, SchedulesOfDayData, StatementItem } from "../types/drclick";

const SYNC_CONCURRENCY = 20;

export interface SyncParams {
  startDate: string;
  endDate: string;
  clinicIds?: string[];
}

export interface SyncResult {
  recordsSynced: number;
  snapshotsSynced: number;
  channelsSynced: number;
  originsSynced: number;
  daysSynced: number;
  startDate: string;
  endDate: string;
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseScheduleDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Sincroniza os dados da API do Dr.Click para o periodo informado,
// persistindo no PostgreSQL para fins de historico, relatorios e cache.
// Os valores gravados sao exatamente os retornados pela API. Usa upsert
// com chaves unicas para evitar duplicacao de registros.
//
// Periodos com mais de um dia sao sincronizados DIA A DIA (sequencialmente):
// isso e' necessario para gravar o resumo diario exato em DailyMetrics
// (usado pelo dashboard para servir do banco em vez da API ao vivo quando
// o periodo consultado ja estiver totalmente sincronizado). Cada dia gera
// uma linha propria em SyncLog, para a tela "Logs de Sincronizacao".
export async function runSync(params: SyncParams): Promise<SyncResult> {
  const clinicIds =
    params.clinicIds && params.clinicIds.length > 0 ? params.clinicIds : env.drclick.clinicIds;
  const days = listDaysBetween(params.startDate, params.endDate);

  const totals: SyncResult = {
    recordsSynced: 0,
    snapshotsSynced: 0,
    channelsSynced: 0,
    originsSynced: 0,
    daysSynced: 0,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  for (const day of days) {
    const startedAt = new Date();
    try {
      const result = await syncSingleDay(day, clinicIds);
      totals.recordsSynced += result.recordsSynced;
      totals.snapshotsSynced += result.snapshotsSynced;
      totals.channelsSynced += result.channelsSynced;
      totals.originsSynced += result.originsSynced;
      totals.daysSynced += 1;

      await prisma.syncLog.create({
        data: {
          startDate: parseDate(day),
          endDate: parseDate(day),
          clinicIds: clinicIds.join(","),
          status: "success",
          recordsSynced: result.recordsSynced,
          startedAt,
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.syncLog.create({
        data: {
          startDate: parseDate(day),
          endDate: parseDate(day),
          clinicIds: clinicIds.join(","),
          status: "error",
          message: error instanceof Error ? error.message : "Erro desconhecido",
          startedAt,
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  invalidateCache();

  return totals;
}

interface SingleDayResult {
  recordsSynced: number;
  snapshotsSynced: number;
  channelsSynced: number;
  originsSynced: number;
}

async function syncSingleDay(day: string, clinicIds: string[]): Promise<SingleDayResult> {
  const data = await getSchedulesOfDay(
    { startDate: day, endDate: day, clinicIds },
    { bypassCache: true }
  );

  const batchId = randomUUID();
  const date = parseDate(day);
  const clinicId = clinicIds.length === 1 ? clinicIds[0] : null;

  // Clinicas: garante que existem registros para as clinicas consultadas
  await Promise.all(
    clinicIds.map((id) =>
      prisma.clinic.upsert({
        where: { id },
        update: {},
        create: { id },
      })
    )
  );

  // Colaboradores + snapshots de performance (roleStatement)
  const roleUsers: { role: string; user: RoleStatementUser }[] = [];
  for (const group of data.roleStatement) {
    for (const user of group.users) {
      roleUsers.push({ role: group.role, user });
    }
  }

  let snapshotsSynced = 0;
  await runWithConcurrency(roleUsers, SYNC_CONCURRENCY, async ({ role, user }) => {
    await prisma.user.upsert({
      where: { userId: user.user_id },
      update: { name: user.name, role },
      create: { userId: user.user_id, name: user.name, role },
    });

    await prisma.performanceSnapshot.upsert({
      where: {
        uniq_snapshot_period: { userId: user.user_id, startDate: date, endDate: date },
      },
      update: {
        role,
        patients: user.patients,
        consultations: user.schedules.cons,
        exams: user.schedules.exam,
        procedures: user.schedules.proc,
        returns: user.schedules.ret,
        combos: user.combos,
        revenue: user.revenue,
        serviceorderAmount: user.serviceorder_amount,
        serviceorderBilled: user.serviceorder_billed,
        amountPlan: user.amoun_plan,
      },
      create: {
        userId: user.user_id,
        clinicId,
        date,
        startDate: date,
        endDate: date,
        role,
        patients: user.patients,
        newPatients: 0,
        consultations: user.schedules.cons,
        exams: user.schedules.exam,
        procedures: user.schedules.proc,
        returns: user.schedules.ret,
        combos: user.combos,
        revenue: user.revenue,
        serviceorderAmount: user.serviceorder_amount,
        serviceorderBilled: user.serviceorder_billed,
        amountPlan: user.amoun_plan,
      },
    });
    snapshotsSynced += 1;
  });

  // Detalhamento de agendamentos (statement)
  const recordsSynced = await syncScheduleRecords(data.statement, clinicId, batchId);

  // Canais de atendimento
  let channelsSynced = 0;
  for (const channel of data.summary.serviceChannelSummary) {
    await prisma.serviceChannel.upsert({
      where: { uniq_channel_period: { startDate: date, endDate: date, name: channel.name } },
      update: { count: channel.count },
      create: { clinicId, startDate: date, endDate: date, name: channel.name, count: channel.count },
    });
    channelsSynced += 1;
  }

  // Origens de atendimento
  let originsSynced = 0;
  for (const origin of data.summary.serviceOriginSummary) {
    await prisma.serviceOrigin.upsert({
      where: { uniq_origin_period: { startDate: date, endDate: date, name: origin.name } },
      update: { count: origin.count },
      create: { clinicId, startDate: date, endDate: date, name: origin.name, count: origin.count },
    });
    originsSynced += 1;
  }

  await upsertDailyMetrics(date, clinicIds, data);

  logger.info(
    `Sincronizacao de ${day} concluida: ${recordsSynced} agendamentos, ${snapshotsSynced} snapshots`
  );

  return { recordsSynced, snapshotsSynced, channelsSynced, originsSynced };
}

// Grava o "selo de dia sincronizado": os totais exatos que a API retornou
// para este dia especifico, usados depois para servir consultas de periodos
// ja sincronizados direto do banco (ver drclickCache.service.ts).
function computeStatusBreakdown(statement: StatementItem[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const item of statement) {
    const status = item.status?.trim();
    if (!status) continue;
    breakdown[status] = (breakdown[status] ?? 0) + 1;
  }
  return breakdown;
}

async function upsertDailyMetrics(
  date: Date,
  clinicIds: string[],
  data: SchedulesOfDayData
): Promise<void> {
  const statusBreakdown = computeStatusBreakdown(data.statement);
  const attendedSchedules = statusBreakdown["atendido"] ?? 0;

  await prisma.dailyMetrics.upsert({
    where: { uniq_daily_metrics: { date, clinicIds: clinicIds.join(",") } },
    update: {
      totalSchedules: data.statement.length,
      attendedSchedules,
      statusBreakdown,
      consultations: data.summary.mainSummary.schedules.cons,
      exams: data.summary.mainSummary.schedules.exam,
      procedures: data.summary.mainSummary.schedules.proc,
      returns: data.summary.mainSummary.schedules.ret,
      patients: data.summary.mainSummary.patients,
      newPatients: data.summary.mainSummary.newPatients,
      revenue: data.summary.mainSummary.revenue,
      combos: data.roleStatement.reduce(
        (sum, group) => sum + group.users.reduce((s, u) => s + u.combos, 0),
        0
      ),
      syncedAt: new Date(),
    },
    create: {
      date,
      clinicIds: clinicIds.join(","),
      totalSchedules: data.statement.length,
      attendedSchedules,
      statusBreakdown,
      consultations: data.summary.mainSummary.schedules.cons,
      exams: data.summary.mainSummary.schedules.exam,
      procedures: data.summary.mainSummary.schedules.proc,
      returns: data.summary.mainSummary.schedules.ret,
      patients: data.summary.mainSummary.patients,
      newPatients: data.summary.mainSummary.newPatients,
      revenue: data.summary.mainSummary.revenue,
      combos: data.roleStatement.reduce(
        (sum, group) => sum + group.users.reduce((s, u) => s + u.combos, 0),
        0
      ),
    },
  });
}

export interface SyncLogEntry {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  recordsSynced: number;
  message: string | null;
  durationSeconds: number | null;
}

// Lista o historico de execucoes de sincronizacao, mais recentes primeiro,
// para a tela "Logs de Sincronizacao" (Dr.Click > Logs de Sincronizacao).
export async function listSyncLogs(limit = 50): Promise<SyncLogEntry[]> {
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    startedAt: log.startedAt,
    finishedAt: log.finishedAt,
    status: log.status,
    recordsSynced: log.recordsSynced,
    message: log.message,
    durationSeconds: log.finishedAt
      ? (log.finishedAt.getTime() - log.startedAt.getTime()) / 1000
      : null,
  }));
}

async function syncScheduleRecords(
  statement: StatementItem[],
  clinicId: string | null,
  batchId: string
): Promise<number> {
  let count = 0;

  await runWithConcurrency(statement, SYNC_CONCURRENCY, async (item) => {
    await prisma.scheduleRecord.upsert({
      where: {
        uniq_schedule_dedupe: {
          patient: item.patient,
          scheduleDate: parseScheduleDate(item.scheduleDate),
          service: item.service ?? "",
          professional: item.professional ?? "",
        },
      },
      update: {
        status: item.status,
        statusText: item.statusText,
        category: item.category,
        convenio: item.convenio,
        value: item.value ?? 0,
        healthPlanValue: item.health_plan_value ?? 0,
        idordemservico: item.idordemservico,
        syncBatchId: batchId,
      },
      create: {
        clinicId,
        status: item.status,
        statusText: item.statusText,
        creationDate: item.creationDate ? parseScheduleDate(item.creationDate) : null,
        scheduleDate: parseScheduleDate(item.scheduleDate),
        patient: item.patient,
        professional: item.professional,
        category: item.category,
        service: item.service,
        convenio: item.convenio,
        value: item.value ?? 0,
        healthPlanValue: item.health_plan_value ?? 0,
        idordemservico: item.idordemservico,
        syncBatchId: batchId,
      },
    });
    count += 1;
  });

  return count;
}
