import { AppError } from "../utils/AppError";
import { getPerformanceByUserId } from "./performance.service";
import { getEmployeeScoreForMonth } from "./employeeScores.service";
import { calculateBonus, BonusBreakdown } from "./bonusProgram.service";

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface EmployeeFeedback {
  employee: { id: string; name: string; role: string };
  month: string;
  // Indicadores automaticos (Dr.Click) + manuais, juntos para a visao geral
  // do operador pedida para a tela de Feedback.
  stats: {
    agendamentos: number;
    pacientesAtendidos: number;
    conversionRate: number | null;
    answeredCalls: number;
    voxiaScore: number | null;
  };
  // Campos manuais editaveis nesta tela (alem de answeredCalls/voxiaScore,
  // que ja aparecem em stats acima).
  manual: {
    testScore: number | null;
    hasAbsenceOrLateness: boolean;
    hasPenalty: boolean;
  };
  bonus: BonusBreakdown;
}

// Primeiro e ultimo dia do mes (AAAA-MM-DD), em UTC - mesma convencao usada
// no resto do backend para datas sem horario.
function monthDateRange(monthStr: string): { startDate: string; endDate: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

export async function getEmployeeFeedback(employeeId: string, monthStr: string): Promise<EmployeeFeedback> {
  if (!MONTH_FORMAT.test(monthStr)) {
    throw new AppError("Mes invalido. Use o formato AAAA-MM.", 400);
  }

  const { startDate, endDate } = monthDateRange(monthStr);
  const [{ employee }, manual] = await Promise.all([
    getPerformanceByUserId(employeeId, { startDate, endDate }),
    getEmployeeScoreForMonth(employeeId, monthStr),
  ]);

  const bonus = calculateBonus({
    agendamentos: employee.totalSchedules,
    hasAbsenceOrLateness: manual.hasAbsenceOrLateness,
    hasPenalty: manual.hasPenalty,
    prova: manual.testScore,
    voxiaScore: manual.voxiaScore,
  });

  return {
    employee: { id: employee.employeeId, name: employee.name, role: employee.role },
    month: monthStr,
    stats: {
      agendamentos: employee.totalSchedules,
      pacientesAtendidos: employee.attendedSchedules,
      conversionRate: employee.conversionRate,
      answeredCalls: manual.answeredCalls,
      voxiaScore: manual.voxiaScore,
    },
    manual: {
      testScore: manual.testScore,
      hasAbsenceOrLateness: manual.hasAbsenceOrLateness,
      hasPenalty: manual.hasPenalty,
    },
    bonus,
  };
}

export interface EmployeeFeedbackMonth {
  month: string;
  stats: EmployeeFeedback["stats"];
  bonus: BonusBreakdown;
}

// AAAA-MM dos ultimos N meses terminando em endMonth (incluso), mais antigo
// primeiro - para o grafico de progresso mostrar a evolucao mes a mes.
function lastMonths(endMonth: string, count: number): string[] {
  const [year, month] = endMonth.split("-").map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// Historico dos ultimos N meses (padrao 6) de um colaborador - usado no
// grafico de progresso e nos indicadores de variacao (vs mes anterior) da
// tela de Feedback. Reaproveita getEmployeeFeedback mes a mes (mesma fonte
// de verdade, nunca recalcula nada diferente).
export async function getEmployeeFeedbackHistory(
  employeeId: string,
  endMonth: string,
  count: number
): Promise<EmployeeFeedbackMonth[]> {
  if (!MONTH_FORMAT.test(endMonth)) {
    throw new AppError("Mes invalido. Use o formato AAAA-MM.", 400);
  }
  if (!Number.isFinite(count) || count < 1 || count > 24) {
    throw new AppError("Parametro months deve ser um numero entre 1 e 24.", 400);
  }

  const months = lastMonths(endMonth, count);
  const results = await Promise.all(
    months.map(async (month) => {
      const feedback = await getEmployeeFeedback(employeeId, month);
      return { month, stats: feedback.stats, bonus: feedback.bonus };
    })
  );

  return results;
}
