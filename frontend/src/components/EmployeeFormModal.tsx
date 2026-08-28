import { FormEvent, useEffect, useState } from "react";
import { Employee, EmployeeInput } from "../types/employee";

interface EmployeeFormModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSubmit: (input: EmployeeInput) => Promise<void>;
  isSubmitting?: boolean;
}

const EMPTY_FORM: EmployeeInput = {
  name: "",
  role: "",
  email: "",
  phone: "",
  avatarUrl: "",
  active: true,
  admissionDate: "",
};

export function EmployeeFormModal({ employee, onClose, onSubmit, isSubmitting }: EmployeeFormModalProps) {
  const [form, setForm] = useState<EmployeeInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        role: employee.role,
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        avatarUrl: employee.avatarUrl ?? "",
        active: employee.active,
        admissionDate: employee.admissionDate ? employee.admissionDate.slice(0, 10) : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [employee]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.role.trim()) {
      setError("Nome e cargo são obrigatórios.");
      return;
    }

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o colaborador.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {employee ? "Editar colaborador" : "Novo colaborador"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Nome completo *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Cargo/equipe *</span>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Ex: TELEFONIA"
                className="input"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Data de admissão</span>
              <input
                type="date"
                value={form.admissionDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">E-mail</span>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Telefone</span>
              <input
                type="text"
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input"
              />
            </label>

            <label className="col-span-2 flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">URL da foto/avatar</span>
              <input
                type="text"
                value={form.avatarUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://..."
                className="input"
              />
            </label>

            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-slate-700">Colaborador ativo</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
