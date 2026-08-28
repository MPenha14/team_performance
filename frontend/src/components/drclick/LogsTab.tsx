import { useSyncLogs } from "../../hooks/useDrClick";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { formatDateTime } from "../../utils/format";

export function LogsTab() {
  const { data: logs, isLoading, refetch, isRefetching } = useSyncLogs();

  return (
    <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Histórico de sincronizações</h3>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Atualizar
        </button>
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && (logs?.length ?? 0) === 0 && (
        <EmptyState message="Nenhuma sincronização registrada ainda." />
      )}

      {!isLoading && logs && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Iniciado em</th>
                <th className="px-4 py-3">Finalizado em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Processados</th>
                <th className="px-4 py-3 text-right">Duração</th>
                <th className="px-4 py-3">Erros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(log.startedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.finishedAt ? formatDateTime(log.finishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        log.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.status === "success" ? "Sucesso" : "Erro"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{log.recordsSynced}</td>
                  <td className="px-4 py-3 text-right">
                    {log.durationSeconds !== null ? `${log.durationSeconds.toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
