import { getSchedulesOfDay, QueryFilters } from "./drclickQuery.service";

export interface DirectoryUser {
  userId: string;
  name: string;
  role: string;
}

// Deriva a lista de colaboradores diretamente do roleStatement retornado
// pela API para o periodo informado (nao ha endpoint dedicado de usuarios
// no Dr.Click, entao a lista reflete quem teve atividade no periodo).
export async function listUsers(filters: QueryFilters): Promise<DirectoryUser[]> {
  const data = await getSchedulesOfDay(filters, { includeAllChannels: true });

  const users: DirectoryUser[] = [];

  for (const group of data.roleStatement) {
    for (const user of group.users) {
      users.push({ userId: user.user_id, name: user.name, role: group.role });
    }
  }

  return users;
}
