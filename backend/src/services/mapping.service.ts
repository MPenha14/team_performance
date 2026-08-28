import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";
import { getSchedulesOfDay, QueryFilters } from "./drclickQuery.service";

export interface MappingInput {
  employeeId: string;
  drclickUserId: string;
  drclickName: string;
  drclickRole?: string | null;
}

export async function listMappings() {
  return prisma.drClickMapping.findMany({
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMapping(input: MappingInput) {
  if (!input.employeeId || !input.drclickUserId || !input.drclickName) {
    throw new AppError(
      "Informe o colaborador, o user_id e o nome retornados pelo Dr.Click para criar o mapeamento.",
      400
    );
  }

  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }

  try {
    return await prisma.drClickMapping.create({
      data: {
        employeeId: input.employeeId,
        drclickUserId: input.drclickUserId,
        drclickName: input.drclickName,
        drclickRole: input.drclickRole || null,
      },
      include: { employee: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(
        "Este usuário do Dr.Click já está mapeado para outro colaborador.",
        409
      );
    }
    throw error;
  }
}

export async function deleteMapping(id: string): Promise<void> {
  const mapping = await prisma.drClickMapping.findUnique({ where: { id } });
  if (!mapping) {
    throw new AppError("Mapeamento não encontrado.", 404);
  }
  await prisma.drClickMapping.delete({ where: { id } });
}

export interface SetEmployeeMappingInput {
  drclickUserId: string | null;
  drclickName?: string;
  drclickRole?: string | null;
}

// Define (ou remove) o mapeamento de UM colaborador para uma conta do
// Dr.Click. Usado pela tela "Dr.Click > Mapeamento de Colaboradores", onde
// cada colaborador cadastrado tem um unico seletor de conta Dr.Click.
export async function setEmployeeMapping(employeeId: string, input: SetEmployeeMappingInput) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { mappings: true },
  });
  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }

  await prisma.drClickMapping.deleteMany({ where: { employeeId } });

  if (!input.drclickUserId) {
    return prisma.employee.findUnique({ where: { id: employeeId }, include: { mappings: true } });
  }

  try {
    await prisma.drClickMapping.create({
      data: {
        employeeId,
        drclickUserId: input.drclickUserId,
        drclickName: input.drclickName || input.drclickUserId,
        drclickRole: input.drclickRole || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(
        "Este usuário do Dr.Click já está mapeado para outro colaborador.",
        409
      );
    }
    throw error;
  }

  return prisma.employee.findUnique({ where: { id: employeeId }, include: { mappings: true } });
}

export interface AutoMapResult {
  mapped: number;
  employees: { employeeId: string; name: string; drclickUserId: string; drclickName: string }[];
}

// Tenta mapear automaticamente colaboradores ainda sem conta vinculada,
// casando o nome cadastrado com o nome retornado pela API do Dr.Click
// (comparacao exata, sem acentos/maiusculas). Nao mapeia nada quando ha
// ambiguidade (mais de uma conta Dr.Click com o mesmo nome).
export async function autoMapByName(filters: QueryFilters): Promise<AutoMapResult> {
  const data = await getSchedulesOfDay(filters, { includeAllChannels: true });
  const existingMappings = await prisma.drClickMapping.findMany({
    select: { drclickUserId: true },
  });
  const mappedIds = new Set(existingMappings.map((m) => m.drclickUserId));

  const byName = new Map<string, { userId: string; name: string; role: string }[]>();
  for (const group of data.roleStatement) {
    for (const user of group.users) {
      if (mappedIds.has(user.user_id)) continue;
      const key = normalizeName(user.name);
      const list = byName.get(key) ?? [];
      list.push({ userId: user.user_id, name: user.name, role: group.role });
      byName.set(key, list);
    }
  }

  const employees = await prisma.employee.findMany({
    where: { mappings: { none: {} } },
  });

  const result: AutoMapResult = { mapped: 0, employees: [] };

  for (const employee of employees) {
    const candidates = byName.get(normalizeName(employee.name));
    if (!candidates || candidates.length !== 1) continue;

    const candidate = candidates[0];
    try {
      await prisma.drClickMapping.create({
        data: {
          employeeId: employee.id,
          drclickUserId: candidate.userId,
          drclickName: candidate.name,
          drclickRole: candidate.role,
        },
      });
      mappedIds.add(candidate.userId);
      result.mapped += 1;
      result.employees.push({
        employeeId: employee.id,
        name: employee.name,
        drclickUserId: candidate.userId,
        drclickName: candidate.name,
      });
    } catch {
      // Conflito de unicidade (corrida rara) - ignora e segue para o proximo
    }
  }

  return result;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export interface UnmappedDrClickUser {
  userId: string;
  name: string;
  role: string;
}

// Lista os usuarios retornados pela API do Dr.Click (roleStatement) para o
// periodo informado que ainda NAO possuem mapeamento para um colaborador
// cadastrado. Usado na tela de Mapeamento para escolher quem vincular.
export async function listUnmappedDrClickUsers(
  filters: QueryFilters
): Promise<UnmappedDrClickUser[]> {
  const data = await getSchedulesOfDay(filters, { includeAllChannels: true });
  const existingMappings = await prisma.drClickMapping.findMany({
    select: { drclickUserId: true },
  });
  const mappedIds = new Set(existingMappings.map((m) => m.drclickUserId));

  const seen = new Set<string>();
  const result: UnmappedDrClickUser[] = [];

  for (const group of data.roleStatement) {
    for (const user of group.users) {
      if (mappedIds.has(user.user_id) || seen.has(user.user_id)) continue;
      seen.add(user.user_id);
      result.push({ userId: user.user_id, name: user.name, role: group.role });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
