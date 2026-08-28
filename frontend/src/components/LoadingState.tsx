import { useEffect, useState } from "react";

export function LoadingState({ label = "Carregando dados..." }: { label?: string }) {
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowHint(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-12 shadow-card ring-1 ring-slate-900/5">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm text-slate-500">{label}</p>
      {showSlowHint && (
        <p className="max-w-sm text-center text-xs text-slate-400">
          Períodos longos podem levar até 1-2 minutos, pois a API do Dr.Click retorna todos os
          registros do intervalo de uma vez. Para respostas mais rápidas, prefira períodos de até
          30 dias.
        </p>
      )}
    </div>
  );
}
