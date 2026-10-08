import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { EmployeeScore, EmployeeScoreInput } from "../types/employeeScore";

export async function fetchScoresForMonth(month: string): Promise<EmployeeScore[]> {
  const { data } = await api.get<ApiEnvelope<EmployeeScore[]>>("/employee-scores", {
    params: { month },
  });
  return data.data;
}

export async function updateEmployeeScore(
  employeeId: string,
  month: string,
  input: EmployeeScoreInput
): Promise<EmployeeScore> {
  const { data } = await api.put<ApiEnvelope<EmployeeScore>>(
    `/employee-scores/${employeeId}/${month}`,
    input
  );
  return data.data;
}
