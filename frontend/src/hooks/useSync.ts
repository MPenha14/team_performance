import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerSync } from "../services/performanceService";
import { GlobalFilters } from "./useFilters";

export function useSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filters: GlobalFilters) => triggerSync(filters),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
