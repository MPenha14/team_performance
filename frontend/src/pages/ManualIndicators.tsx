import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { LoadingState } from "../components/LoadingState";
import { useMetricsHistory, useMonthlyMetric, useUpdateMonthlyMetric } from "../hooks/useCallCenterMetrics";
import { useScoresForMonth, useUpdateEmployeeScore } from "../hooks/useEmployeeScores";
import { EmployeeScore } from "../types/employeeScore";
import { formatPercent } from "../utils/format";

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7);
}

// Formata "YYYY-MM" como "Outubro de 2026", sem passar por fuso local (o
// mes nao tem dia/hora - usar Date() comum pode exibir o mes errado perto
// da virada do mes em fusos negativos).
function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function ManualIndicators() {
  const [month, setMonth] = useState(currentMonthIso());
  const { data: metric, isLoading } = useMonthlyMetric(month);
  const { data: history } = useMetricsHistory();
  const updateMetric = useUpdateMonthlyMetric();

  const [offeredCalls, setOfferedCalls] = useState("0");
  const [answeredCalls, setAnsweredCalls] = useState("0");
  const [voxiaScore, setVoxiaScore] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!metric) return;
    setOfferedCalls(String(metric.offeredCalls));
    setAnsweredCalls(String(metric.answeredCalls));
    setVoxiaScore(metric.voxiaScore !== null ? String(metric.voxiaScore) : "");
    setSaved(false);
  }, [metric]);

  const serviceLevel =
    Number(offeredCalls) > 0 ? (Number(answeredCalls) / Number(offeredCalls)) * 100 : null;

  const handleSave = () => {
    updateMetric.mutate(
      {
        month,
        offeredCalls: Number(offeredCalls) || 0,
        answeredCalls: Number(answeredCalls) || 0,
        voxiaScore: voxiaScore.trim() === "" ? null : Number(voxiaScore),
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  return (
    <>
      <TopBar
        title="Indicadores Manuais"
        subtitle="Chamadas ofertadas, atendidas e Nota Voxia — Equipe Call Center"
      />

      <main className="flex-1 space-y-6 p-6">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-slate-500">Mês</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input w-48"
            />
          </label>

          <p className="mt-3 text-xs text-slate-500">
            Selecione o mês e lance os valores referentes ao mês inteiro. O Nível de Serviço (NS) é
            calculado automaticamente a partir da conversão de chamadas ofertadas em chamadas
            atendidas e aparece no Dashboard do Call Center.
          </p>

          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-slate-500">Chamadas Ofertadas</span>
                <input
                  type="number"
                  min={0}
                  value={offeredCalls}
                  onChange={(e) => setOfferedCalls(e.target.value)}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-slate-500">Chamadas Atendidas</span>
                <input
                  type="number"
                  min={0}
                  value={answeredCalls}
                  onChange={(e) => setAnsweredCalls(e.target.value)}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-slate-500">Nível de Serviço (NS)</span>
                <div className="input flex items-center bg-slate-50 text-slate-500">
                  {serviceLevel !== null ? formatPercent(serviceLevel) : "—"}
                </div>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium text-slate-500">Nota Voxia (0 a 10)</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step="0.1"
                  value={voxiaScore}
                  onChange={(e) => setVoxiaScore(e.target.value)}
                  className="input"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={updateMetric.isPending || isLoading}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMetric.isPending ? "Salvando..." : "Salvar"}
            </button>
            {saved && <span className="text-sm text-emerald-600">Salvo ✓</span>}
          </div>
        </div>

        {history && history.length > 0 && (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-slate-900/5">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-5 py-3">Chamadas Ofertadas</th>
                  <th className="px-5 py-3">Chamadas Atendidas</th>
                  <th className="px-5 py-3">NS</th>
                  <th className="px-5 py-3">Nota Voxia</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {history.map((row) => {
                  const ns = row.offeredCalls > 0 ? (row.answeredCalls / row.offeredCalls) * 100 : null;
                  return (
                    <tr key={row.month} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5 font-medium text-slate-700">
                        {formatMonthLabel(row.month)}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">{row.offeredCalls}</td>
                      <td className="px-5 py-2.5 text-slate-600">{row.answeredCalls}</td>
                      <td className="px-5 py-2.5 text-slate-600">{ns !== null ? formatPercent(ns) : "—"}</td>
                      <td className="px-5 py-2.5 text-slate-600">{row.voxiaScore ?? "—"}</td>
                      <td className="px-5 py-2.5 text-right">
                        <button
                          onClick={() => setMonth(row.month)}
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <EmployeeScoreSection />
      </main>
    </>
  );
}

// Chamadas Atendidas e Nota Voxia lancadas individualmente por colaborador,
// por mes - secao separada dos indicadores do time acima, sem afetar aquele
// calculo nem o Dashboard. Lista todos os colaboradores do Call Center de
// uma vez, cada um com seus proprios campos, salvando linha a linha (igual
// aos nomes de clinica em Configurações).
function EmployeeScoreSection() {
  const [month, setMonth] = useState(currentMonthIso());
  const { data: scores, isLoading } = useScoresForMonth(month);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Indicadores por Colaborador</h2>
          <p className="mt-1 text-xs text-slate-500">
            Lançamento individual, por colaborador e por mês — não altera os indicadores do time
            acima. Nota Voxia aqui é em percentual (0 a 100), diferente da Nota Voxia geral do time
            acima (0 a 10).
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-xs font-medium text-slate-500">Mês</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-48" />
        </label>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl ring-1 ring-slate-100">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Colaborador</th>
                <th className="px-4 py-2.5">Chamadas Atendidas</th>
                <th className="px-4 py-2.5">Nota Voxia (%)</th>
              </tr>
            </thead>
            <tbody>
              {(scores ?? []).map((row) => (
                <EmployeeScoreRow key={row.employeeId} month={month} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmployeeScoreRow({ month, row }: { month: string; row: EmployeeScore }) {
  const updateScore = useUpdateEmployeeScore();
  const [answeredCalls, setAnsweredCalls] = useState(String(row.answeredCalls));
  const [voxiaScore, setVoxiaScore] = useState(row.voxiaScore !== null ? String(row.voxiaScore) : "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAnsweredCalls(String(row.answeredCalls));
    setVoxiaScore(row.voxiaScore !== null ? String(row.voxiaScore) : "");
  }, [row.answeredCalls, row.voxiaScore]);

  const handleSave = () => {
    const nextAnswered = Number(answeredCalls) || 0;
    const nextScore = voxiaScore.trim() === "" ? null : Number(voxiaScore);
    if (nextAnswered === row.answeredCalls && nextScore === row.voxiaScore) return;

    updateScore.mutate(
      { employeeId: row.employeeId, month, input: { voxiaScore: nextScore, answeredCalls: nextAnswered } },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        },
      }
    );
  };

  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="px-4 py-2.5 font-medium text-slate-700">{row.employeeName}</td>
      <td className="px-4 py-2.5">
        <input
          type="number"
          min={0}
          value={answeredCalls}
          onChange={(e) => setAnsweredCalls(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="input w-24 py-1.5"
        />
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={voxiaScore}
            onChange={(e) => setVoxiaScore(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="input w-24 py-1.5"
          />
          {updateScore.isPending && <span className="text-xs text-slate-400">Salvando…</span>}
          {saved && <span className="text-xs text-emerald-600">Salvo ✓</span>}
        </div>
      </td>
    </tr>
  );
}
