import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { FilterBar } from "../components/FilterBar";
import { ConfigTab } from "../components/drclick/ConfigTab";
import { LogsTab } from "../components/drclick/LogsTab";
import { MappingTab } from "../components/drclick/MappingTab";
import { useFilters } from "../hooks/useFilters";
import { usePerformance } from "../hooks/usePerformance";

type TabKey = "config" | "logs" | "mapping";

const TABS: { key: TabKey; label: string }[] = [
  { key: "config", label: "Configuração" },
  { key: "logs", label: "Logs de Sincronização" },
  { key: "mapping", label: "Mapeamento de Colaboradores" },
];

export function DrClickIntegration() {
  const [tab, setTab] = useState<TabKey>("config");
  const { filters } = useFilters();
  const { isLoading, refetch } = usePerformance(filters);

  return (
    <>
      <TopBar title="Integração Dr.Click" subtitle="Conexão, sincronização e mapeamento de colaboradores" />

      <main className="flex-1 space-y-6 p-6">
        <FilterBar onRefresh={() => refetch()} isRefreshing={isLoading} />

        <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-slate-900/5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "config" && <ConfigTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "mapping" && <MappingTab />}
      </main>
    </>
  );
}
