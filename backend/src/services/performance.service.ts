import { prisma } from "../utils/prisma";
import {
  extractUserTotals,
  getSchedulesOfDayForUser,
  getSchedulesOfDayForUsers,
  QueryFilters,
} from "./drclickQuery.service";
import { RoleStatementUser, ServiceChannelSummaryItem } from "../types/drclick";
import { AppError } from "../utils/AppError";
import { UserTotals } from "./drclickCache.service";
import { getAttendedCounts } from "./attendance.service";
import { getAdvancePayments } from "./advancePayment.service";

// Performance de um colaborador CADASTRADO manualmente (Employee), agregando
// os valores das contas do Dr.Click mapeadas para ele (DrClickMapping).
// Cada numero individual continua sendo exatamente o que a API retornou
// para aquele user_id; quando um colaborador tem mais de uma conta mapeada,
// os valores dessas contas sao somados (nunca recalculados/estimados).
export interface EmployeePerformance {
  employeeId: string;
  name: string;
  role: string;
  team: string;
  active: boolean;
  avatarUrl: string | null;
  patients: number;
  newPatients: number;
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  totalSchedules: number;
  // Agendamentos com status "atendido" no periodo, contados por DATA DO
  // AGENDAMENTO (via /api/reports/appointmentbystatus) - diferente de
  // totalSchedules, que conta por data de criacao (/schedulesofday). Um
  // paciente costuma ser agendado dias antes e so e' atendido na data
  // marcada, por isso as duas contagens usam bases diferentes de proposito.
  attendedSchedules: number;
  // attendedSchedules / totalSchedules * 100. null quando totalSchedules e'
  // 0 (nao ha base para calcular uma taxa - evita mostrar "0%" de forma
  // enganosa quando na verdade e' "sem agendamentos criados no periodo").
  conversionRate: number | null;
  combos: number;
  revenue: number;
  serviceorderAmount: number;
  serviceorderBilled: number;
  amountPlan: number;
  // Recebimento antecipado (total_amount_billed do endpoint
  // /api/reports/users-performance) - so calculado para colaboradores da
  // equipe Midias Sociais (team === "MIDIAS_SOCIAIS"); fica 0 para os
  // demais, que nao usam esse indicador.
  advancePayment: number;
  mappedAccounts: { userId: string; name: string }[];
}

export interface PerformanceFilters extends QueryFilters {
  role?: string;
  employeeId?: string;
  includeInactive?: boolean;
  team?: string;
}

function emptyEmployeePerformance(
  employee: {
    id: string;
    name: string;
    role: string;
    team: string;
    active: boolean;
    avatarUrl: string | null;
  },
  mappedAccounts: { userId: string; name: string }[]
): EmployeePerformance {
  return {
    employeeId: employee.id,
    name: employee.name,
    role: employee.role,
    team: employee.team,
    active: employee.active,
    avatarUrl: employee.avatarUrl,
    patients: 0,
    newPatients: 0,
    consultations: 0,
    exams: 0,
    procedures: 0,
    returns: 0,
    totalSchedules: 0,
    attendedSchedules: 0,
    conversionRate: null,
    combos: 0,
    revenue: 0,
    serviceorderAmount: 0,
    serviceorderBilled: 0,
    amountPlan: 0,
    advancePayment: 0,
    mappedAccounts,
  };
}

function addUserTotals(target: EmployeePerformance, source: UserTotals): void {
  target.patients += source.patients;
  target.consultations += source.consultations;
  target.exams += source.exams;
  target.procedures += source.procedures;
  target.returns += source.returns;
  target.combos += source.combos;
  target.revenue += source.revenue;
  target.serviceorderAmount += source.serviceorderAmount;
  target.serviceorderBilled += source.serviceorderBilled;
  target.amountPlan += source.amountPlan;
  target.totalSchedules =
    target.consultations + target.exams + target.procedures + target.returns;
}

function roleStatementUserToTotals(user: RoleStatementUser): UserTotals {
  return {
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
  };
}

function sumMainSummary(results: EmployeePerformance[]) {
  const totals = {
    users: results.length,
    userIds: results.flatMap((r) => r.mappedAccounts.map((a) => a.userId)),
    schedules: { cons: 0, exam: 0, proc: 0, ret: 0 },
    patientsIds: [] as string[],
    newPatientsIds: [] as string[],
    patients: 0,
    newPatients: 0,
    revenue: 0,
    serviceorder_amount: 0,
    serviceorder_billed: 0,
  };

  for (const r of results) {
    totals.schedules.cons += r.consultations;
    totals.schedules.exam += r.exams;
    totals.schedules.proc += r.procedures;
    totals.schedules.ret += r.returns;
    totals.patients += r.patients;
    totals.newPatients += r.newPatients;
    totals.revenue += r.revenue;
    totals.serviceorder_amount += r.serviceorderAmount;
    totals.serviceorder_billed += r.serviceorderBilled;
  }

  return totals;
}

// Busca, para cada colaborador CADASTRADO (via suas contas Dr.Click
// mapeadas), o total de agendamentos - uma chamada por conta, filtrada no
// servidor pelo parametro "user" do /schedulesofday (nao pelo canal de
// atendimento). Isso bate exatamente com o que o Dr.Click mostra para
// aquele colaborador, mesmo quando ele tem agendamentos fora do canal
// Telefonia (ex.: colaboradores de Supervisao que tambem atendem outros
// canais ocasionalmente).
export async function listPerformance(filters: PerformanceFilters) {
  const employees = await prisma.employee.findMany({
    where: {
      active: filters.includeInactive ? undefined : true,
      role: filters.role || undefined,
      id: filters.employeeId || undefined,
      team: filters.team || undefined,
    },
    include: { mappings: true },
    orderBy: { name: "asc" },
  });

  const allUserIds = employees.flatMap((e) => e.mappings.map((m) => m.drclickUserId));
  const userTotals = await getSchedulesOfDayForUsers(allUserIds, filters);

  const results: EmployeePerformance[] = employees.map((employee) => {
    const mappedAccounts = employee.mappings.map((m) => ({
      userId: m.drclickUserId,
      name: m.drclickName,
    }));
    const performance = emptyEmployeePerformance(employee, mappedAccounts);

    for (const mapping of employee.mappings) {
      const totals = userTotals.get(mapping.drclickUserId);
      if (totals) {
        addUserTotals(performance, roleStatementUserToTotals(totals));
      }
    }

    return performance;
  });

  await applyAttendedCounts(results, filters);
  await applyAdvancePayments(results, filters);

  return {
    summary: {
      mainSummary: sumMainSummary(results),
      serviceChannelSummary: [] as ServiceChannelSummaryItem[],
      serviceOriginSummary: [] as ServiceChannelSummaryItem[],
    },
    employees: results,
  };
}

// Busca, para cada colaborador, quantos dos seus agendamentos estao com
// status "atendido" no periodo (via appointmentbystatus, uma unica chamada
// agregada para toda a clinica) e calcula a conversao. Nao afeta
// totalSchedules (que continua vindo de /schedulesofday por colaborador) -
// sao duas fontes/bases distintas, combinadas apenas para exibir o
// indicador de conversao.
async function applyAttendedCounts(
  employees: EmployeePerformance[],
  filters: QueryFilters
): Promise<void> {
  const allUserIds = employees.flatMap((e) => e.mappedAccounts.map((a) => a.userId));
  if (allUserIds.length === 0) return;

  const attendedByUser = await getAttendedCounts(allUserIds, filters);

  for (const employee of employees) {
    employee.attendedSchedules = employee.mappedAccounts.reduce(
      (sum, account) => sum + (attendedByUser.get(account.userId) ?? 0),
      0
    );
    employee.conversionRate =
      employee.totalSchedules > 0
        ? (employee.attendedSchedules / employee.totalSchedules) * 100
        : null;
  }
}

// Busca o recebimento antecipado (total_amount_billed) dos colaboradores
// da equipe Midias Sociais - nao se aplica ao Call Center, entao pula a
// chamada por completo quando nao ha ninguem dessa equipe na lista (evita
// chamadas desnecessarias ao Dr.Click).
async function applyAdvancePayments(
  employees: EmployeePerformance[],
  filters: QueryFilters
): Promise<void> {
  const midiasSociaisEmployees = employees.filter((e) => e.team === "MIDIAS_SOCIAIS");
  const allUserIds = midiasSociaisEmployees.flatMap((e) => e.mappedAccounts.map((a) => a.userId));
  if (allUserIds.length === 0) return;

  const advanceByUser = await getAdvancePayments(allUserIds, filters);

  for (const employee of midiasSociaisEmployees) {
    employee.advancePayment = employee.mappedAccounts.reduce(
      (sum, account) => sum + (advanceByUser.get(account.userId) ?? 0),
      0
    );
  }
}

export async function getPerformanceByUserId(employeeId: string, filters: QueryFilters) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { mappings: true },
  });

  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }

  const mappedAccounts = employee.mappings.map((m) => ({
    userId: m.drclickUserId,
    name: m.drclickName,
  }));
  const performance = emptyEmployeePerformance(employee, mappedAccounts);

  const channels = new Map<string, number>();
  const origins = new Map<string, number>();

  for (const mapping of employee.mappings) {
    const data = await getSchedulesOfDayForUser(mapping.drclickUserId, filters);
    const totals = extractUserTotals(data, mapping.drclickUserId);
    if (totals) {
      addUserTotals(performance, roleStatementUserToTotals(totals));
    }
    for (const item of data.summary.serviceChannelSummary) {
      channels.set(item.name, (channels.get(item.name) ?? 0) + item.count);
    }
    for (const item of data.summary.serviceOriginSummary) {
      origins.set(item.name, (origins.get(item.name) ?? 0) + item.count);
    }
  }

  await applyAttendedCounts([performance], filters);
  await applyAdvancePayments([performance], filters);

  return {
    employee: performance,
    channels: Array.from(channels.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    origins: Array.from(origins.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
