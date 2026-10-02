import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";

export interface CallCenterMonthlyMetricDto {
  month: string; // YYYY-MM
  offeredCalls: number;
  answeredCalls: number;
  voxiaScore: number | null;
}

export interface ManualIndicatorsSummary {
  offeredCalls: number;
  answeredCalls: number;
  // Conversao de chamadas ofertadas -> atendidas, em percentual. Null
  // quando nao ha chamadas ofertadas registradas no periodo (sem base de
  // calculo).
  serviceLevel: number | null;
  // Media da Nota Voxia entre os meses do periodo que tem nota lancada.
  // Null quando nenhum mes do periodo tem nota.
  voxiaScore: number | null;
}

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

function toMonthDate(monthStr: string): Date {
  if (!MONTH_FORMAT.test(monthStr)) {
    throw new AppError("Mes invalido. Use o formato AAAA-MM.", 400);
  }
  return new Date(`${monthStr}-01T00:00:00.000Z`);
}

function toMonthString(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function toDto(row: {
  month: Date;
  offeredCalls: number;
  answeredCalls: number;
  voxiaScore: Prisma.Decimal | null;
}): CallCenterMonthlyMetricDto {
  return {
    month: toMonthString(row.month),
    offeredCalls: row.offeredCalls,
    answeredCalls: row.answeredCalls,
    voxiaScore: row.voxiaScore !== null ? Number(row.voxiaScore) : null,
  };
}

// Lista todos os meses que ja tem lancamento, mais recente primeiro - usado
// no historico da tela de Indicadores Manuais.
export async function listMonthlyMetrics(): Promise<CallCenterMonthlyMetricDto[]> {
  const rows = await prisma.callCenterMonthlyMetric.findMany({ orderBy: { month: "desc" } });
  return rows.map(toDto);
}

// Busca o lancamento de um mes especifico. Quando o mes ainda nao foi
// lancado, retorna zerado (nao 404) - a tela usa isso para prefill do
// formulario de um mes novo.
export async function getMonthlyMetric(monthStr: string): Promise<CallCenterMonthlyMetricDto> {
  const month = toMonthDate(monthStr);
  const row = await prisma.callCenterMonthlyMetric.findUnique({ where: { month } });
  return row ? toDto(row) : { month: monthStr, offeredCalls: 0, answeredCalls: 0, voxiaScore: null };
}

export async function upsertMonthlyMetric(
  monthStr: string,
  input: { offeredCalls: number; answeredCalls: number; voxiaScore: number | null }
): Promise<CallCenterMonthlyMetricDto> {
  const month = toMonthDate(monthStr);

  if (!Number.isFinite(input.offeredCalls) || input.offeredCalls < 0) {
    throw new AppError("Chamadas ofertadas deve ser um numero maior ou igual a zero.", 400);
  }
  if (!Number.isFinite(input.answeredCalls) || input.answeredCalls < 0) {
    throw new AppError("Chamadas atendidas deve ser um numero maior ou igual a zero.", 400);
  }
  if (
    input.voxiaScore !== null &&
    (!Number.isFinite(input.voxiaScore) || input.voxiaScore < 0)
  ) {
    throw new AppError("Nota Voxia deve ser um numero maior ou igual a zero.", 400);
  }

  const data = {
    offeredCalls: input.offeredCalls,
    answeredCalls: input.answeredCalls,
    voxiaScore: input.voxiaScore,
  };

  const row = await prisma.callCenterMonthlyMetric.upsert({
    where: { month },
    update: data,
    create: { month, ...data },
  });

  return toDto(row);
}

// Meses (AAAA-MM) que tem qualquer sobreposicao com o periodo start/end
// (datas AAAA-MM-DD) - usado para agregar os lancamentos mensais no
// Dashboard, que filtra por um intervalo de dias.
function monthsOverlapping(startDate: string, endDate: string): Date[] {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  const months: Date[] = [];
  while (cursor.getTime() <= endCursor.getTime()) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export async function getManualIndicatorsSummary(
  startDate: string,
  endDate: string
): Promise<ManualIndicatorsSummary> {
  const months = monthsOverlapping(startDate, endDate);
  const rows = await prisma.callCenterMonthlyMetric.findMany({
    where: { month: { in: months } },
  });

  let offeredCalls = 0;
  let answeredCalls = 0;
  let voxiaSum = 0;
  let voxiaCount = 0;

  for (const row of rows) {
    offeredCalls += row.offeredCalls;
    answeredCalls += row.answeredCalls;
    if (row.voxiaScore !== null) {
      voxiaSum += Number(row.voxiaScore);
      voxiaCount += 1;
    }
  }

  return {
    offeredCalls,
    answeredCalls,
    serviceLevel: offeredCalls > 0 ? (answeredCalls / offeredCalls) * 100 : null,
    voxiaScore: voxiaCount > 0 ? voxiaSum / voxiaCount : null,
  };
}
