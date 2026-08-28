import { useQuery } from "@tanstack/react-query";
import { fetchClinics } from "../services/performanceService";

export function useClinics() {
  return useQuery({
    queryKey: ["clinics"],
    queryFn: fetchClinics,
    staleTime: 60 * 60 * 1000,
  });
}
