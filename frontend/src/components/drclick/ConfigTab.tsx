import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useClinics } from "../../hooks/useUsersAndClinics";
import { useSync } from "../../hooks/useSync";
import { useFilters } from "../../hooks/useFilters";
import { LoadingState } from "../LoadingState";

interface HealthData {
  status: string;
  database: string;
  drclickConfigured: boolean;
  clinicsConfigured: number;
}

export function ConfigTab() {
  const { filters } = useFilters();
  const { data: health, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: HealthData }>("/health");
      return res.data.data;
    },
  });
  const { data: clinics } = useClinics();
  const sync = useSync();

  const [syncDate, setSyncDate] = useState(filters.startDate);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSyncDay = async () => {
    setFeedback(null);
    try {
      await sync.mutateAsync({ ...filters, startDate: syncDate, endDate: syncDate });
      setFeedback(`Sincronização de ${syncDate} concluída com sucesso.`);
    } catch {
      setFeedback("Não foi possível sincronizar este dia. Tente novamente.");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Conexão com a API</h3>
        <dl className="space-y-3 text-sm">
          <Row label="Status do backend" ok={health?.status === "ok"} value={health?.status ?? "—"} />
          <Row
            label="Credenciais Dr.Click"
            ok={Boolean(health?.drclickConfigured)}
            value={health?.drclickConfigured ? "Configuradas" : "Não configuradas"}
          />
          <Row
            label="Banco de dados"
            ok={health?.database === "connected"}
            value={health?.database ?? "—"}
          />
          <Row
            label="Clínicas configuradas"
            ok={Boolean(health?.clinicsConfigured)}
            value={String(health?.clinicsConfigured ?? 0)}
          />
        </dl>
        <p className="mt-4 text-xs text-slate-400">
          O token de acesso ao Dr.Click é configurado apenas no servidor (variáveis de ambiente) e
          nunca é exibido ou editável por aqui, por segurança.
        </p>

        {clinics && clinics.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clínicas
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {clinics.map((clinic) => (
                <li key={clinic.id} className="flex items-center justify-between">
                  <span>{clinic.name}</span>
                  <span className="font-mono text-xs text-slate-400">{clinic.id}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Sincronizar manualmente</h3>
        <p className="mb-4 text-xs text-slate-500">
          Atualiza os indicadores da data selecionada. Indicado para corrigir um dia específico.
        </p>
        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-slate-500">Data</span>
            <input
              type="date"
              value={syncDate}
              onChange={(e) => setSyncDate(e.target.value)}
              className="input"
            />
          </label>
          <button
            onClick={handleSyncDay}
            disabled={sync.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {sync.isPending ? "Sincronizando..." : "Sincronizar dia"}
          </button>
        </div>
        {feedback && <p className="mt-3 text-sm text-slate-600">{feedback}</p>}

        <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          A sincronização automática roda a cada 15 minutos (configurável no servidor via
          <code className="mx-1 rounded bg-slate-100 px-1 py-0.5">SYNC_CRON_EXPRESSION</code>).
        </div>
      </div>
    </div>
  );
}

function Row({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="flex items-center gap-2 font-medium text-slate-800">
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
        {value}
      </dd>
    </div>
  );
}
