import { useMemo, useState } from "react";
import { useFilters } from "../../hooks/useFilters";
import { useEmployees } from "../../hooks/useEmployees";
import { useDrClickUsers } from "../../hooks/useDrClick";
import { useAutoMap, useSetEmployeeMapping } from "../../hooks/useMappings";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

// A busca de contas do Dr.Click so retorna quem teve alguma atividade no
// periodo consultado. Um periodo de um unico dia (ex: "hoje") facilmente
// deixa de fora colaboradores que nao atenderam exatamente naquele dia -
// por isso esta aba usa um periodo proprio (padrao: ultimos 7 dias),
// independente do filtro global do Dashboard.
export function MappingTab() {
  const { filters: globalFilters } = useFilters();
  const [startDate, setStartDate] = useState(isoDaysAgo(6));
  const [endDate, setEndDate] = useState(isoDaysAgo(0));

  const searchFilters = useMemo(
    () => ({ startDate, endDate, clinicIds: globalFilters.clinicIds }),
    [startDate, endDate, globalFilters.clinicIds]
  );

  const {
    data: employees,
    isLoading: loadingEmployees,
    isError,
    error,
    refetch: refetchEmployees,
  } = useEmployees(true);
  const { data: drclickUsers, isLoading: loadingUsers, refetch: refetchUsers } =
    useDrClickUsers(searchFilters);

  const setMapping = useSetEmployeeMapping();
  const autoMap = useAutoMap();
  const [autoMapMessage, setAutoMapMessage] = useState<string | null>(null);

  const isLoading = loadingEmployees || loadingUsers;

  const handleReload = () => {
    refetchEmployees();
    refetchUsers();
  };

  const handleAutoMap = async () => {
    setAutoMapMessage(null);
    const result = await autoMap.mutateAsync(searchFilters);
    setAutoMapMessage(
      result.mapped > 0
        ? `${result.mapped} colaborador(es) mapeado(s) automaticamente por nome.`
        : "Nenhum colaborador novo pôde ser mapeado automaticamente (nomes sem correspondência exata, sem atividade no período ou já mapeados)."
    );
  };

  const handleSelectChange = (employeeId: string, value: string) => {
    if (!value) {
      setMapping.mutate({ employeeId, drclickUserId: null });
      return;
    }
    const user = drclickUsers?.find((u) => u.userId === value);
    setMapping.mutate({
      employeeId,
      drclickUserId: value,
      drclickName: user?.name,
      drclickRole: user?.role,
    });
  };

  return (
    <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Mapeamento de Colaboradores</h3>
          <p className="text-xs text-slate-500">
            Vincule cada colaborador cadastrado à conta correspondente no Dr.Click.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-500">Buscar contas ativas desde</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-500">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input py-1.5 text-sm"
            />
          </label>
          <button
            onClick={handleAutoMap}
            disabled={autoMap.isPending || isLoading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {autoMap.isPending ? "Mapeando..." : "Auto-mapear por nome"}
          </button>
          <button
            onClick={handleReload}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Recarregar
          </button>
        </div>
      </div>

      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        Só aparecem aqui contas do Dr.Click com pelo menos um agendamento no período acima. Se um
        colaborador não aparecer na lista, amplie o período (períodos muito longos podem demorar
        para carregar).
      </p>

      {autoMapMessage && (
        <div className="border-b border-slate-100 bg-brand-50 px-4 py-2 text-xs text-brand-700">
          {autoMapMessage}
        </div>
      )}

      {isLoading && <LoadingState label="Carregando colaboradores e contas do Dr.Click..." />}
      {isError && <ErrorState error={error} onRetry={handleReload} />}
      {!isLoading && !isError && (employees?.length ?? 0) === 0 && (
        <EmptyState message="Nenhum colaborador cadastrado ainda. Cadastre em Colaboradores primeiro." />
      )}

      {!isLoading && !isError && employees && employees.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Usuário Dr.Click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => {
                const currentMapping = employee.mappings[0];
                return (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                    <td className="px-4 py-3 text-slate-500">{employee.role}</td>
                    <td className="px-4 py-3">
                      <select
                        value={currentMapping?.drclickUserId ?? ""}
                        onChange={(e) => handleSelectChange(employee.id, e.target.value)}
                        disabled={setMapping.isPending}
                        className="input min-w-[260px] py-1.5 text-sm"
                      >
                        <option value="">— Não mapeado —</option>
                        {currentMapping &&
                          !drclickUsers?.some((u) => u.userId === currentMapping.drclickUserId) && (
                            <option value={currentMapping.drclickUserId}>
                              [{currentMapping.drclickUserId}] {currentMapping.drclickName}
                              {currentMapping.drclickRole ? ` — ${currentMapping.drclickRole}` : ""}
                            </option>
                          )}
                        {(drclickUsers ?? []).map((user) => (
                          <option key={user.userId} value={user.userId}>
                            [{user.userId}] {user.name} — {user.role}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
