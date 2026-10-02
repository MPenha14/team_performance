import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";

export interface EmployeeScoreDto {
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  score: number | null;
}

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

function toMonthDate(monthStr: string): Date {
  if (!MONTH_FORMAT.test(monthStr)) {
    throw new AppError("Mes invalido. Use o formato AAAA-MM.", 400);
  }
  return new Date(`${monthStr}-01T00:00:00.000Z`);
}

// Lista TODOS os colaboradores ativos do Call Center com a nota do mes
// informado (null quando ainda nao foi lancada) - a tela mostra a lista
// inteira de uma vez, para lancar a nota de cada um sem precisar selecionar
// colaborador por colaborador.
export async function listEmployeeScoresForMonth(monthStr: string): Promise<EmployeeScoreDto[]> {
  const month = toMonthDate(monthStr);

  const employees = await prisma.employee.findMany({
    where: { team: "CALL_CENTER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const scores = await prisma.callCenterEmployeeScore.findMany({ where: { month } });
  const byEmployee = new Map(scores.map((row) => [row.employeeId, Number(row.score)]));

  return employees.map((employee) => ({
    employeeId: employee.id,
    employeeName: employee.name,
    month: monthStr,
    score: byEmployee.get(employee.id) ?? null,
  }));
}

export async function upsertEmployeeScore(
  employeeId: string,
  monthStr: string,
  score: number
): Promise<EmployeeScoreDto> {
  const month = toMonthDate(monthStr);

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { name: true } });
  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }
  if (!Number.isFinite(score) || score < 0) {
    throw new AppError("Nota deve ser um numero maior ou igual a zero.", 400);
  }

  const row = await prisma.callCenterEmployeeScore.upsert({
    where: { uniq_employee_score_month: { employeeId, month } },
    update: { score },
    create: { employeeId, month, score },
  });

  return {
    employeeId,
    employeeName: employee.name,
    month: monthStr,
    score: Number(row.score),
  };
}
