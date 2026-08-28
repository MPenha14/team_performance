import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { Employee, EmployeeInput, Team } from "../types/employee";

export async function fetchEmployees(includeInactive = true, team?: Team): Promise<Employee[]> {
  const { data } = await api.get<ApiEnvelope<Employee[]>>("/employees", {
    params: { include_inactive: includeInactive, team },
  });
  return data.data;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data } = await api.get<ApiEnvelope<Employee>>(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data } = await api.post<ApiEnvelope<Employee>>("/employees", input);
  return data.data;
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
  const { data } = await api.put<ApiEnvelope<Employee>>(`/employees/${id}`, input);
  return data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}
