import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";

export interface EmployeeScoreDto {
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  voxiaScore: number | null;
  answeredCalls: number;
  testScore: number | null;
  hasAbsenceOrLateness: boolean;
  hasPenalty: boolean;
}

// Campos editaveis via upsert - cada chamador (tela de Indicadores Manuais,
// tela de Feedback) envia so os campos que de fato edita; os demais ficam
// como ja estavam (update parcial, nunca sobrescreve o que a outra tela
// gravou).
export interface UpsertEmployeeScoreInput {
  voxiaScore?: number | null;
  answeredCalls?: number;
  testScore?: number | null;
  hasAbsenceOrLateness?: boolean;
  hasPenalty?: boolean;
}

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

function toMonthDate(monthStr: string): Date {
  if (!MONTH_FORMAT.test(monthStr)) {
    throw new AppError("Mes invalido. Use o formato AAAA-MM.", 400);
  }
  return new Date(`${monthStr}-01T00:00:00.000Z`);
}

function toDto(
  employeeId: string,
  employeeName: string,
  monthStr: string,
  row?: {
    voxiaScore: Prisma.Decimal | null;
    answeredCalls: number;
    testScore: Prisma.Decimal | null;
    hasAbsenceOrLateness: boolean;
    hasPenalty: boolean;
  }
): EmployeeScoreDto {
  return {
    employeeId,
    employeeName,
    month: monthStr,
    voxiaScore: row?.voxiaScore !== null && row?.voxiaScore !== undefined ? Number(row.voxiaScore) : null,
    answeredCalls: row?.answeredCalls ?? 0,
    testScore: row?.testScore !== null && row?.testScore !== undefined ? Number(row.testScore) : null,
    hasAbsenceOrLateness: row?.hasAbsenceOrLateness ?? false,
    hasPenalty: row?.hasPenalty ?? false,
  };
}

// Lista TODOS os colaboradores ativos do Call Center com os dados manuais do
// mes informado (zerado/null quando ainda nao foi lancado) - a tela mostra
// a lista inteira de uma vez, para lancar os valores de cada um sem
// precisar selecionar colaborador por colaborador.
export async function listEmployeeScoresForMonth(monthStr: string): Promise<EmployeeScoreDto[]> {
  const month = toMonthDate(monthStr);

  const employees = await prisma.employee.findMany({
    where: { team: "CALL_CENTER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const scores = await prisma.callCenterEmployeeScore.findMany({ where: { month } });
  const byEmployee = new Map(scores.map((row) => [row.employeeId, row]));

  return employees.map((employee) =>
    toDto(employee.id, employee.name, monthStr, byEmployee.get(employee.id))
  );
}

// Busca os dados manuais de UM colaborador em um mes especifico - usado
// pela tela de Feedback, que combina isso com os indicadores automaticos
// (Agendamentos, Conversao, etc.) e a conta do Desempenho Total.
export async function getEmployeeScoreForMonth(
  employeeId: string,
  monthStr: string
): Promise<EmployeeScoreDto> {
  const month = toMonthDate(monthStr);

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { name: true } });
  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }

  const row = await prisma.callCenterEmployeeScore.findUnique({
    where: { uniq_employee_score_month: { employeeId, month } },
  });

  return toDto(employeeId, employee.name, monthStr, row ?? undefined);
}

export async function upsertEmployeeScore(
  employeeId: string,
  monthStr: string,
  input: UpsertEmployeeScoreInput
): Promise<EmployeeScoreDto> {
  const month = toMonthDate(monthStr);

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { name: true } });
  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }
  if (
    input.voxiaScore !== undefined &&
    input.voxiaScore !== null &&
    (!Number.isFinite(input.voxiaScore) || input.voxiaScore < 0)
  ) {
    throw new AppError("Nota Voxia deve ser um numero maior ou igual a zero.", 400);
  }
  if (
    input.answeredCalls !== undefined &&
    (!Number.isFinite(input.answeredCalls) || input.answeredCalls < 0)
  ) {
    throw new AppError("Chamadas atendidas deve ser um numero maior ou igual a zero.", 400);
  }
  if (
    input.testScore !== undefined &&
    input.testScore !== null &&
    (!Number.isFinite(input.testScore) || input.testScore < 0)
  ) {
    throw new AppError("Nota da prova deve ser um numero maior ou igual a zero.", 400);
  }

  const data: Prisma.CallCenterEmployeeScoreUpdateInput = {};
  if (input.voxiaScore !== undefined) data.voxiaScore = input.voxiaScore;
  if (input.answeredCalls !== undefined) data.answeredCalls = input.answeredCalls;
  if (input.testScore !== undefined) data.testScore = input.testScore;
  if (input.hasAbsenceOrLateness !== undefined) data.hasAbsenceOrLateness = input.hasAbsenceOrLateness;
  if (input.hasPenalty !== undefined) data.hasPenalty = input.hasPenalty;

  const row = await prisma.callCenterEmployeeScore.upsert({
    where: { uniq_employee_score_month: { employeeId, month } },
    update: data,
    create: {
      employeeId,
      month,
      voxiaScore: input.voxiaScore ?? null,
      answeredCalls: input.answeredCalls ?? 0,
      testScore: input.testScore ?? null,
      hasAbsenceOrLateness: input.hasAbsenceOrLateness ?? false,
      hasPenalty: input.hasPenalty ?? false,
    },
  });

  return toDto(employeeId, employee.name, monthStr, row);
}
