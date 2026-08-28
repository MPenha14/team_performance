import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { Employee, MappingWithEmployee } from "../types/employee";
import { GlobalFilters } from "../hooks/useFilters";

export async function fetchMappings(): Promise<MappingWithEmployee[]> {
  const { data } = await api.get<ApiEnvelope<MappingWithEmployee[]>>("/mappings");
  return data.data;
}

export async function deleteMapping(id: string): Promise<void> {
  await api.delete(`/mappings/${id}`);
}

export interface SetEmployeeMappingInput {
  drclickUserId: string | null;
  drclickName?: string;
  drclickRole?: string;
}

// Define (ou remove, quando drclickUserId e null) o vinculo do colaborador
// com uma conta do Dr.Click. Usado no seletor por linha da tela
// "Dr.Click > Mapeamento de Colaboradores".
export async function setEmployeeMapping(
  employeeId: string,
  input: SetEmployeeMappingInput
): Promise<Employee> {
  const { data } = await api.put<ApiEnvelope<Employee>>(`/employees/${employeeId}/mapping`, input);
  return data.data;
}

export interface AutoMapResult {
  mapped: number;
  employees: { employeeId: string; name: string; drclickUserId: string; drclickName: string }[];
}

export async function autoMapByName(filters: GlobalFilters): Promise<AutoMapResult> {
  const { data } = await api.post<ApiEnvelope<AutoMapResult>>(
    "/mappings/auto-map",
    {},
    {
      params: {
        start_date: filters.startDate,
        end_date: filters.endDate,
        idclinica: filters.clinicIds.length > 0 ? filters.clinicIds.join(",") : undefined,
      },
    }
  );
  return data.data;
}
