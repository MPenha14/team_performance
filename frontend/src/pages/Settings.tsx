import { useQuery } from "@tanstack/react-query";
import { TopBar } from "../components/TopBar";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { api } from "../services/api";
import { useClinics } from "../hooks/useUsersAndClinics";

interface HealthData {
  status: string;
  timestamp: string;
  database: string;
  drclickConfigured: boolean;
  clinicsConfigured: number;
}

export function Settings() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: HealthData }>("/health");
      return res.data.data;
    },
    refetchInterval: 60 * 1000,
  });
  const { data: clinics } = useClinics();

  return (
    <>
      <TopBar title="Configurações" subtitle="Status da integração e ambiente" />

      <main className="flex-1 space-y-6 p-6">
        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
              <h3 className="text-sm font-semibold text-slate-800">Status do Sistema</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <StatusRow label="Backend" ok={data.status === "ok"} value={data.status} />
                <StatusRow label="Banco de dados" ok={data.database === "connected"} value={data.database} />
                <StatusRow
                  label="Credenciais Dr.Click"
                  ok={data.drclickConfigured}
                  value={data.drclickConfigured ? "Configuradas" : "Não configuradas"}
                />
                <StatusRow
                  label="Clínicas configuradas"
                  ok={data.clinicsConfigured > 0}
                  value={String(data.clinicsConfigured)}
                />
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
              <h3 className="text-sm font-semibold text-slate-800">Clínicas</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {(clinics ?? []).map((clinic) => (
                  <li key={clinic.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span>{clinic.name}</span>
                    <span className="font-mono text-xs text-slate-400">{clinic.id}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800">Sincronização automática</h3>
              <p className="mt-2 text-sm text-slate-500">
                O sistema sincroniza os dados do Dr.Click automaticamente a cada 15 minutos e
                mantém histórico no PostgreSQL. Use o botão "Sincronizar agora" no Dashboard para
                forçar uma sincronização imediata.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
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
