import { useFilters } from "../hooks/useFilters";

interface DateRangeBarProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

function countDays(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
}

// Filtro simplificado do Dashboard: apenas periodo inicial/final.
export function DateRangeBar({ onRefresh, isRefreshing }: DateRangeBarProps) {
  const { filters, setStartDate, setEndDate } = useFilters();
  const days = countDays(filters.startDate, filters.endDate);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-slate-500">Período inicial</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-slate-500">Período final</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </label>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Atualizar dados
        </button>
      </div>

      {days > 30 && (
        <p className="mt-3 text-xs text-amber-600">
          Período de {days} dias selecionado — consultas assim podem levar mais tempo, pois a API
          do Dr.Click retorna todos os registros do intervalo de uma vez. Prefira períodos de até
          30 dias quando possível.
        </p>
      )}
    </div>
  );
}
