import { ReactNode, useMemo, useState } from "react";
import { FiltersContext, GlobalFilters } from "../hooks/useFilters";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFilters(): GlobalFilters {
  const today = todayIso();
  return { startDate: today, endDate: today, clinicIds: [] };
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters());

  const value = useMemo(
    () => ({
      filters,
      setStartDate: (value: string) => setFilters((prev) => ({ ...prev, startDate: value })),
      setEndDate: (value: string) => setFilters((prev) => ({ ...prev, endDate: value })),
      setClinicIds: (value: string[]) => setFilters((prev) => ({ ...prev, clinicIds: value })),
      setRole: (value: string | undefined) => setFilters((prev) => ({ ...prev, role: value })),
      setEmployeeId: (value: string | undefined) =>
        setFilters((prev) => ({ ...prev, employeeId: value })),
      resetFilters: () => setFilters(defaultFilters()),
    }),
    [filters]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}
