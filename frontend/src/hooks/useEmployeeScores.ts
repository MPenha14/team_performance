import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchScoresForMonth, updateEmployeeScore } from "../services/employeeScoresService";
import { EmployeeScoreInput } from "../types/employeeScore";

export function useScoresForMonth(month: string) {
  return useQuery({
    queryKey: ["employee-scores", month],
    queryFn: () => fetchScoresForMonth(month),
    enabled: Boolean(month),
  });
}

export function useUpdateEmployeeScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      month,
      input,
    }: {
      employeeId: string;
      month: string;
      input: EmployeeScoreInput;
    }) => updateEmployeeScore(employeeId, month, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-scores"] });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}
