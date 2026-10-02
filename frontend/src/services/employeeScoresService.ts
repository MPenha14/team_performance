import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { EmployeeScore } from "../types/employeeScore";

export async function fetchScoresForMonth(month: string): Promise<EmployeeScore[]> {
  const { data } = await api.get<ApiEnvelope<EmployeeScore[]>>("/employee-scores", {
    params: { month },
  });
  return data.data;
}

export async function updateEmployeeScore(
  employeeId: string,
  month: string,
  score: number
): Promise<EmployeeScore> {
  const { data } = await api.put<ApiEnvelope<EmployeeScore>>(`/employee-scores/${employeeId}/${month}`, {
    score,
  });
  return data.data;
}
