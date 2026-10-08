import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";
import { EmployeeFeedback, EmployeeFeedbackMonth } from "../types/feedback";

export async function fetchEmployeeFeedback(employeeId: string, month: string): Promise<EmployeeFeedback> {
  const { data } = await api.get<ApiEnvelope<EmployeeFeedback>>(`/feedback/${employeeId}`, {
    params: { month },
  });
  return data.data;
}

export async function fetchEmployeeFeedbackHistory(
  employeeId: string,
  month: string,
  months = 4
): Promise<EmployeeFeedbackMonth[]> {
  const { data } = await api.get<ApiEnvelope<EmployeeFeedbackMonth[]>>(`/feedback/${employeeId}/history`, {
    params: { month, months },
  });
  return data.data;
}
