import { createContext, useContext } from "react";

export interface GlobalFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  clinicIds: string[];
  role?: string;
  employeeId?: string;
}

export interface FiltersContextValue {
  filters: GlobalFilters;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setClinicIds: (value: string[]) => void;
  setRole: (value: string | undefined) => void;
  setEmployeeId: (value: string | undefined) => void;
  resetFilters: () => void;
}

export const FiltersContext = createContext<FiltersContextValue | undefined>(undefined);

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters deve ser usado dentro de um FiltersProvider");
  }
  return ctx;
}
