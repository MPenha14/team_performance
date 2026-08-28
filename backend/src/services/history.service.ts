import { prisma } from "../utils/prisma";

export interface HistoryPoint {
  date: string;
  patients: number;
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  revenue: number;
}

// Le o historico de performance de um colaborador cadastrado a partir dos
// snapshots persistidos no banco (gerados pela sincronizacao), somando os
// valores de todas as contas do Dr.Click mapeadas para ele. Dados reais
// gravados exatamente como vieram da API em cada sincronizacao.
export async function getPerformanceHistory(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<HistoryPoint[]> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { mappings: true },
  });

  if (!employee || employee.mappings.length === 0) {
    return [];
  }

  const drclickUserIds = employee.mappings.map((m) => m.drclickUserId);

  const snapshots = await prisma.performanceSnapshot.findMany({
    where: {
      userId: { in: drclickUserIds },
      startDate: { gte: new Date(`${startDate}T00:00:00.000Z`) },
      endDate: { lte: new Date(`${endDate}T23:59:59.999Z`) },
    },
    orderBy: { startDate: "asc" },
  });

  const byDate = new Map<string, HistoryPoint>();

  for (const snapshot of snapshots) {
    const date = snapshot.startDate.toISOString().slice(0, 10);
    const point = byDate.get(date) ?? {
      date,
      patients: 0,
      consultations: 0,
      exams: 0,
      procedures: 0,
      returns: 0,
      revenue: 0,
    };

    point.patients += snapshot.patients;
    point.consultations += snapshot.consultations;
    point.exams += snapshot.exams;
    point.procedures += snapshot.procedures;
    point.returns += snapshot.returns;
    point.revenue += Number(snapshot.revenue);

    byDate.set(date, point);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
