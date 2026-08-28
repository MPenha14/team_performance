import { prisma } from "../utils/prisma";
import { AppError } from "../utils/AppError";

export interface EmployeeInput {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
  admissionDate?: string | null;
}

function validate(input: EmployeeInput): void {
  if (!input.name || !input.name.trim()) {
    throw new AppError("Informe o nome do colaborador.", 400);
  }
  if (!input.role || !input.role.trim()) {
    throw new AppError("Informe o cargo do colaborador.", 400);
  }
}

export async function listEmployees(includeInactive = true) {
  return prisma.employee.findMany({
    where: includeInactive ? {} : { active: true },
    include: { mappings: true },
    orderBy: { name: "asc" },
  });
}

export async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { mappings: true },
  });

  if (!employee) {
    throw new AppError("Colaborador não encontrado.", 404);
  }

  return employee;
}

export async function createEmployee(input: EmployeeInput) {
  validate(input);

  return prisma.employee.create({
    data: {
      name: input.name.trim(),
      role: input.role.trim(),
      email: input.email || null,
      phone: input.phone || null,
      avatarUrl: input.avatarUrl || null,
      active: input.active ?? true,
      admissionDate: input.admissionDate ? new Date(`${input.admissionDate}T00:00:00.000Z`) : null,
    },
    include: { mappings: true },
  });
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  validate(input);
  await getEmployee(id);

  return prisma.employee.update({
    where: { id },
    data: {
      name: input.name.trim(),
      role: input.role.trim(),
      email: input.email || null,
      phone: input.phone || null,
      avatarUrl: input.avatarUrl || null,
      active: input.active ?? true,
      admissionDate: input.admissionDate ? new Date(`${input.admissionDate}T00:00:00.000Z`) : null,
    },
    include: { mappings: true },
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  await getEmployee(id);
  await prisma.employee.delete({ where: { id } });
}
