import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from "../hooks/useEmployees";
import { Employee, EmployeeInput } from "../types/employee";
import { formatDate } from "../utils/format";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Employees() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees(true);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return (employees ?? []).filter((employee) => {
      if (nameFilter && !employee.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (roleFilter && !employee.role.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (activeFilter === "active" && !employee.active) return false;
      if (activeFilter === "inactive" && employee.active) return false;
      return true;
    });
  }, [employees, nameFilter, roleFilter, activeFilter]);

  const handleClearFilters = () => {
    setNameFilter("");
    setRoleFilter("");
    setActiveFilter("all");
  };

  const handleCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(employee);
    setModalOpen(true);
  };

  const handleDelete = async (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Remover o colaborador "${employee.name}"? O mapeamento com o Dr.Click também será removido.`)) {
      return;
    }
    await deleteEmployee.mutateAsync(employee.id);
  };

  const handleSubmit = async (input: EmployeeInput) => {
    if (editing) {
      await updateEmployee.mutateAsync({ id: editing.id, input });
    } else {
      await createEmployee.mutateAsync(input);
    }
  };

  return (
    <>
      <TopBar title="Colaboradores" subtitle="Cadastro da equipe de Mídias e Call Center" />

      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-end gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
            <Field label="Nome">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Cargo">
              <input
                type="text"
                placeholder="Buscar por cargo..."
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Ativo">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
                className="input"
              >
                <option value="all">Todos</option>
                <option value="active">Sim</option>
                <option value="inactive">Não</option>
              </select>
            </Field>
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Limpar
            </button>
          </div>

          <button
            onClick={handleCreate}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            + Adicionar colaborador
          </button>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState message="Nenhum colaborador encontrado. Ajuste os filtros ou cadastre um novo colaborador." />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Foto</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Cargo</th>
                    <th className="px-4 py-3">Admissão</th>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => navigate(`/colaboradores/${employee.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {employee.avatarUrl ? (
                            <img src={employee.avatarUrl} alt={employee.name} className="h-full w-full object-cover" />
                          ) : (
                            initials(employee.name)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.role}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {employee.admissionDate ? formatDate(employee.admissionDate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{employee.active ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => handleEdit(employee, e)}
                          className="mr-3 text-brand-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => handleDelete(employee, e)}
                          className="text-red-600 hover:underline"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <EmployeeFormModal
          employee={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createEmployee.isPending || updateEmployee.isPending}
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
