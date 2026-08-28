import { getSchedulesOfDay, QueryFilters } from "./drclickQuery.service";
import { StatementItem } from "../types/drclick";

export interface ScheduleQueryFilters extends QueryFilters {
  status?: string;
  search?: string;
  sortBy?: keyof StatementItem;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedSchedules {
  items: StatementItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Retorna o detalhamento de agendamentos (data.statement) EXATAMENTE
// como veio da API, apenas com filtro/ordenacao/paginacao para exibicao.
// Nenhum campo e recalculado ou substituido.
export async function listSchedules(filters: ScheduleQueryFilters): Promise<PaginatedSchedules> {
  const data = await getSchedulesOfDay(filters);

  let items = [...data.statement];

  if (filters.status) {
    items = items.filter(
      (item) => item.status.toLowerCase() === filters.status!.toLowerCase()
    );
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    items = items.filter((item) =>
      [item.patient, item.professional, item.service, item.category, item.convenio]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(search))
    );
  }

  if (filters.sortBy) {
    const sortBy = filters.sortBy;
    const direction = filters.sortDirection === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      if (typeof valueA === "number" && typeof valueB === "number") {
        return (valueA - valueB) * direction;
      }
      return String(valueA).localeCompare(String(valueB)) * direction;
    });
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 25;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  return { items: paginated, total, page, pageSize, totalPages };
}
