import { ApiRequestError } from "../services/api";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

// Nunca exibe detalhes tecnicos (token, stack trace, etc). Mostra apenas
// a mensagem amigavel ja tratada pelo backend.
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message =
    error instanceof ApiRequestError
      ? error.message
      : "Não foi possível consultar os dados do Dr.Click. Tente novamente.";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-12 text-center shadow-card ring-1 ring-slate-900/5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
