import { env } from "../config/env";

export interface ClinicInfo {
  id: string;
  name: string;
}

// A API do Dr.Click nao retorna nomes de clinicas neste endpoint,
// entao expomos os IDs configurados. O campo "name" pode ser
// customizado futuramente via banco de dados (tabela clinics).
export function listClinics(): ClinicInfo[] {
  return env.drclick.clinicIds.map((id, index) => ({
    id,
    name: `Clínica ${index + 1}`,
  }));
}
