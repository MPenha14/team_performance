import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { autoMapByName, deleteMapping, fetchMappings, setEmployeeMapping } from "../services/mappingService";
import { GlobalFilters } from "./useFilters";

export function useMappings() {
  return useQuery({
    queryKey: ["mappings"],
    queryFn: fetchMappings,
    staleTime: 30 * 1000,
  });
}

export function useSetEmployeeMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      drclickUserId,
      drclickName,
      drclickRole,
    }: {
      employeeId: string;
      drclickUserId: string | null;
      drclickName?: string;
      drclickRole?: string;
    }) => setEmployeeMapping(employeeId, { drclickUserId, drclickName, drclickRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mappings"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}

export function useDeleteMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mappings"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}

export function useAutoMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filters: GlobalFilters) => autoMapByName(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mappings"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}
