import { useQuery } from "@tanstack/react-query";
import { fetchEmployeeFeedback, fetchEmployeeFeedbackHistory } from "../services/feedbackService";

export function useEmployeeFeedback(employeeId: string, month: string) {
  return useQuery({
    queryKey: ["feedback", employeeId, month],
    queryFn: () => fetchEmployeeFeedback(employeeId, month),
    enabled: Boolean(employeeId && month),
  });
}

export function useEmployeeFeedbackHistory(employeeId: string, month: string, months = 4) {
  return useQuery({
    queryKey: ["feedback-history", employeeId, month, months],
    queryFn: () => fetchEmployeeFeedbackHistory(employeeId, month, months),
    enabled: Boolean(employeeId && month),
  });
}
