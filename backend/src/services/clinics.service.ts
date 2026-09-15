import { prisma } from "../utils/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface ClinicInfo {
  id: string;
  name: string;
}

// A API do Dr.Click nao retorna nomes de clinicas - o nome real e' definido
// manualmente em Configuracoes e persistido no banco (tabela clinics).
// Enquanto nao for definido, usa um placeholder "Clinica N".
export async function listClinics(): Promise<ClinicInfo[]> {
  const ids = env.drclick.clinicIds;

  const existing = await prisma.clinic.findMany({ where: { id: { in: ids } } });
  const byId = new Map(existing.map((c) => [c.id, c]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    await prisma.clinic.createMany({
      data: missing.map((id) => ({ id })),
      skipDuplicates: true,
    });
  }

  return ids.map((id, index) => ({
    id,
    name: byId.get(id)?.name || `Clínica ${index + 1}`,
  }));
}

export async function updateClinicName(id: string, name: string): Promise<ClinicInfo> {
  if (!env.drclick.clinicIds.includes(id)) {
    throw new AppError("Clínica não encontrada entre as configuradas no servidor.", 404);
  }
  if (!name || !name.trim()) {
    throw new AppError("Informe o nome da clínica.", 400);
  }

  const clinic = await prisma.clinic.upsert({
    where: { id },
    update: { name: name.trim() },
    create: { id, name: name.trim() },
  });

  return { id: clinic.id, name: clinic.name ?? id };
}
