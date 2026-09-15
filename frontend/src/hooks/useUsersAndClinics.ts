import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchClinics, updateClinicName } from "../services/performanceService";

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: fetchClinics,
    staleTime: 60 * 60 * 1000,
  });
}

export function useUpdateClinicName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateClinicName(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
