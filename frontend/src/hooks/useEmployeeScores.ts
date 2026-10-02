import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchScoresForMonth, updateEmployeeScore } from "../services/employeeScoresService";

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
    mutationFn: ({ employeeId, month, score }: { employeeId: string; month: string; score: number }) =>
      updateEmployeeScore(employeeId, month, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-scores"] });
    },
  });
}
