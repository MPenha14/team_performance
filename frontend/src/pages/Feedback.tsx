import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { KpiCard } from "../components/KpiCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { useEmployees } from "../hooks/useEmployees";
import { useEmployeeFeedback, useEmployeeFeedbackHistory } from "../hooks/useFeedback";
import { BonusTrendChart } from "../charts/BonusTrendChart";
import { IndicatorTrendChart, formatMonthShort } from "../charts/IndicatorTrendChart";
import { EmployeeFeedback, EmployeeFeedbackMonth } from "../types/feedback";
import { formatNumber, formatPercent } from "../utils/format";

const DEFAULT_EVOLUTION_MONTHS = 4;
const MAX_EVOLUTION_MONTHS = 12;

function addMonths(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthsBetweenInclusive(start: string, end: string): number {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  return ey * 12 + em - (sy * 12 + sm) + 1;
}

// Comparativo com o mes anterior - nunca so a cor carregando o significado,
// sempre junto com a seta e o texto "vs mes anterior".
function DeltaBadge({
  current,
  previous,
  format,
}: {
  current: number | null;
  previous: number | null | undefined;
  format: (value: number) => string;
}) {
  if (current === null || previous === null || previous === undefined) return null;
  const diff = Math.round((current - previous) * 100) / 100;
  if (diff === 0) {
    return <span className="text-slate-400">— vs mês anterior</span>;
  }
  const up = diff > 0;
  return (
    <span className={`font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? "▲" : "▼"} {format(Math.abs(diff))} vs mês anterior
    </span>
  );
}

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatScore(value: number | null): string {
  return value !== null ? value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—";
}

// Captura um bloco (ref) e adiciona suas paginas ao PDF, fatiando em
// blocos do tamanho de uma pagina (largura cheia) em vez de encolher tudo
// numa pagina so. `isFirstOverall` evita pular pagina em branco antes do
// primeiro bloco capturado.
async function addRefToPdf(
  pdf: jsPDF,
  el: HTMLElement,
  margin: number,
  usableW: number,
  usableH: number,
  isFirstOverall: boolean
): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pxPerMm = canvas.width / usableW;
  const pageHeightPx = Math.floor(usableH * pxPerMm);

  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  const ctx = sliceCanvas.getContext("2d");

  let renderedPx = 0;
  let first = isFirstOverall;
  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    sliceCanvas.height = sliceHeightPx;
    ctx?.clearRect(0, 0, sliceCanvas.width, sliceHeightPx);
    ctx?.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    if (!first) pdf.addPage();
    first = false;
    const sliceHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.85), "JPEG", margin, margin, usableW, sliceHeightMm);

    renderedPx += sliceHeightPx;
  }
}

// Faixas de severidade do desempenho - mesma logica pro Desempenho Total e
// pra cada criterio individualmente (0-100). Fill/track no mesmo tom (meter
// same-ramp), nunca so a cor carregando o significado - sempre acompanhado
// do rotulo (Excelente/Bom/Abaixo do esperado).
interface Tier {
  label: string;
  text: string;
  fill: string;
  track: string;
  chip: string;
}

function tierFor(ratioPct: number): Tier {
  if (ratioPct >= 90) {
    return { label: "Excelente", text: "text-emerald-700", fill: "bg-emerald-600", track: "bg-emerald-100", chip: "bg-emerald-50 text-emerald-700" };
  }
  if (ratioPct >= 70) {
    return { label: "Bom", text: "text-amber-700", fill: "bg-amber-500", track: "bg-amber-100", chip: "bg-amber-50 text-amber-700" };
  }
  return { label: "Abaixo do esperado", text: "text-rose-700", fill: "bg-rose-600", track: "bg-rose-100", chip: "bg-rose-50 text-rose-700" };
}

export function Feedback() {
  const { data: employees } = useEmployees(false, "CALL_CENTER");
  const [busca, setBusca] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(currentMonthIso());
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [evolutionStart, setEvolutionStart] = useState(() => addMonths(currentMonthIso(), -(DEFAULT_EVOLUTION_MONTHS - 1)));
  const [evolutionEnd, setEvolutionEnd] = useState(() => currentMonthIso());
  const topRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!employeeId && employees && employees.length > 0) {
      setEmployeeId(employees[0].id);
    }
  }, [employees, employeeId]);

  const { data, isLoading, isError, error, refetch } = useEmployeeFeedback(employeeId, month);
  // Mes anterior ao selecionado, buscado a parte - so para os indicadores
  // "vs mes anterior" do topo, independente do periodo de comparacao
  // escolhido pelo usuario em Evolucao dos Indicadores.
  const { data: previousMonth } = useEmployeeFeedback(employeeId, addMonths(month, -1));

  // Periodo de comparacao da Evolucao dos Indicadores - o usuario escolhe
  // livremente (De/Ate), independente do mes selecionado acima.
  const safeEvolutionStart = evolutionStart <= evolutionEnd ? evolutionStart : evolutionEnd;
  const evolutionMonthsCount = Math.min(
    MAX_EVOLUTION_MONTHS,
    Math.max(1, monthsBetweenInclusive(safeEvolutionStart, evolutionEnd))
  );
  const { data: history, isLoading: historyLoading } = useEmployeeFeedbackHistory(
    employeeId,
    evolutionEnd,
    evolutionMonthsCount
  );

  const employeesFiltrados = (employees ?? []).filter(
    (employee) => !busca || employee.name.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleDownloadPDF() {
    const topEl = topRef.current;
    const chartsEl = chartsRef.current;
    if (!topEl || !chartsEl || !data) return;
    setGeneratingPDF(true);

    // O PDF sempre mostra o detalhamento completo, independente do estado
    // retratil na tela (clicar ou nao em "Desempenho Total").
    const wasExpanded = showBreakdown;
    if (!wasExpanded) setShowBreakdown(true);

    // Largura fixa pra garantir o grid dos cartoes completo na captura.
    const CAPTURE_WIDTH = 1000;
    const prevTopStyle = topEl.getAttribute("style") ?? "";
    const prevChartsStyle = chartsEl.getAttribute("style") ?? "";

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    topEl.style.width = `${CAPTURE_WIDTH}px`;
    topEl.style.maxWidth = "none";
    chartsEl.style.width = `${CAPTURE_WIDTH}px`;
    chartsEl.style.maxWidth = "none";

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      // O formulario de lancamento (entre os dois blocos na tela) nao entra
      // no PDF - captura o bloco de cima (resumo + bonus) e depois o bloco
      // dos graficos, cada um comecando em pagina nova.
      await addRefToPdf(pdf, topEl, margin, usableW, usableH, true);
      await addRefToPdf(pdf, chartsEl, margin, usableW, usableH, false);

      const nomeArquivo = ["feedback", data.employee.name.replace(/\s+/g, "-").toLowerCase(), month].join("_");
      pdf.save(`${nomeArquivo}.pdf`);
    } finally {
      topEl.setAttribute("style", prevTopStyle);
      chartsEl.setAttribute("style", prevChartsStyle);
      setShowBreakdown(wasExpanded);
      setGeneratingPDF(false);
    }
  }

  return (
    <>
      <TopBar title="Feedback" subtitle="Programa de bonificação  Equipe Call Center" />

      <main className="flex-1 space-y-6 p-6">
        <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-[180px] flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Buscar colaborador</span>
              <input
                type="text"
                placeholder="Digite o nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input"
              />
            </label>
            <label className="flex min-w-[260px] flex-1 flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Colaborador</span>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="input">
                {employeesFiltrados.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-slate-500">Mês</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-48" />
            </label>
            {data && (
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="ml-auto flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingPDF ? "Gerando PDF..." : "⬇ Baixar PDF"}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Chamadas Atendidas, Nota Voxia, Prova, Assiduidade e Penalidades são lançadas em{" "}
          <Link to="/call-center/indicadores-manuais" className="text-brand-600 hover:text-brand-700">
            Indicadores Manuais
          </Link>
          .
        </p>

        {isLoading && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={() => refetch()} />}

        {!isLoading && !isError && data && (
          <>
            <div ref={topRef} className="space-y-6 bg-white">
              <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Media Performance Relatório de Feedback Individual
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{data.employee.name}</h2>
                <p className="text-sm text-slate-500">
                  {data.employee.role} — {formatMonthLabel(data.month)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                <KpiCard
                  label="Agendamentos"
                  value={formatNumber(data.stats.agendamentos)}
                  accent="blue"
                  subValue={
                    <DeltaBadge
                      current={data.stats.agendamentos}
                      previous={previousMonth?.stats.agendamentos}
                      format={(v) => formatNumber(v)}
                    />
                  }
                />
                <KpiCard
                  label="Pacientes Atendidos"
                  value={formatNumber(data.stats.pacientesAtendidos)}
                  accent="emerald"
                  subValue={
                    <DeltaBadge
                      current={data.stats.pacientesAtendidos}
                      previous={previousMonth?.stats.pacientesAtendidos}
                      format={(v) => formatNumber(v)}
                    />
                  }
                />
                <KpiCard
                  label="Conversão"
                  value={data.stats.conversionRate !== null ? formatPercent(data.stats.conversionRate) : "—"}
                  accent="amber"
                  subValue={
                    <DeltaBadge
                      current={data.stats.conversionRate}
                      previous={previousMonth?.stats.conversionRate}
                      format={(v) => formatPercent(v)}
                    />
                  }
                />
                <KpiCard
                  label="Chamadas Atendidas"
                  value={formatNumber(data.stats.answeredCalls)}
                  accent="violet"
                  subValue={
                    <DeltaBadge
                      current={data.stats.answeredCalls}
                      previous={previousMonth?.stats.answeredCalls}
                      format={(v) => formatNumber(v)}
                    />
                  }
                />
                <KpiCard
                  label="Nota Prova"
                  value={data.bonus.prova.value !== null ? formatScore(data.bonus.prova.value) : "—"}
                  accent="slate"
                  subValue={
                    <DeltaBadge
                      current={data.bonus.prova.value}
                      previous={previousMonth?.bonus.prova.value}
                      format={(v) => formatScore(v)}
                    />
                  }
                />
                <KpiCard
                  label="Nota Voxia (%)"
                  value={data.stats.voxiaScore !== null ? `${formatScore(data.stats.voxiaScore)}%` : "—"}
                  accent="rose"
                  subValue={
                    <DeltaBadge
                      current={data.stats.voxiaScore}
                      previous={previousMonth?.stats.voxiaScore}
                      format={(v) => `${formatScore(v)}%`}
                    />
                  }
                />
                <DesempenhoTotalCard
                  total={data.bonus.total}
                  previous={previousMonth?.bonus.total}
                  expanded={showBreakdown}
                  onToggle={() => setShowBreakdown((v) => !v)}
                />
              </div>

              {showBreakdown && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-slate-700">Detalhamento do Desempenho Total</h2>
                  <BonusCriteriaGrid feedback={data} previousMonth={previousMonth} />
                </div>
              )}
            </div>

            <div ref={chartsRef} className="space-y-6 bg-white">
              <EvolutionSection
                history={history}
                historyLoading={historyLoading}
                evolutionStart={evolutionStart}
                evolutionEnd={evolutionEnd}
                onChangeStart={setEvolutionStart}
                onChangeEnd={setEvolutionEnd}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}

function EvolutionSection({
  history,
  historyLoading,
  evolutionStart,
  evolutionEnd,
  onChangeStart,
  onChangeEnd,
}: {
  history: EmployeeFeedbackMonth[] | undefined;
  historyLoading: boolean;
  evolutionStart: string;
  evolutionEnd: string;
  onChangeStart: (value: string) => void;
  onChangeEnd: (value: string) => void;
}) {
  const rangeLabel =
    history && history.length > 0
      ? `${formatMonthShort(history[0].month)} – ${formatMonthShort(history[history.length - 1].month)}`
      : null;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Evolução dos Indicadores</h2>
          <p className="mt-1 text-xs text-slate-500">
            {rangeLabel ? `Período: ${rangeLabel}` : "Selecione o período para comparar"} (máx. {MAX_EVOLUTION_MONTHS}{" "}
            meses)
          </p>
        </div>
        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-slate-500">De</span>
            <input
              type="month"
              value={evolutionStart}
              onChange={(e) => onChangeStart(e.target.value)}
              className="input w-40"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-slate-500">Até</span>
            <input
              type="month"
              value={evolutionEnd}
              onChange={(e) => onChangeEnd(e.target.value)}
              className="input w-40"
            />
          </label>
        </div>
      </div>

      {historyLoading ? (
        <div className="mt-4">
          <LoadingState />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Agendamentos</h3>
            <IndicatorTrendChart
              data={history ?? []}
              month={(m) => m.month}
              value={(m) => m.stats.agendamentos}
              label="Agendamentos"
              color="#2563eb"
              formatValue={(v) => formatNumber(v)}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Conversão</h3>
            <IndicatorTrendChart
              data={history ?? []}
              month={(m) => m.month}
              value={(m) => m.stats.conversionRate}
              label="Conversão"
              color="#f59e0b"
              formatValue={(v) => formatPercent(v)}
              domain={[0, 100]}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chamadas Atendidas</h3>
            <IndicatorTrendChart
              data={history ?? []}
              month={(m) => m.month}
              value={(m) => m.stats.answeredCalls}
              label="Chamadas Atendidas"
              color="#7c3aed"
              formatValue={(v) => formatNumber(v)}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Nota Prova</h3>
            <IndicatorTrendChart
              data={history ?? []}
              month={(m) => m.month}
              value={(m) => m.bonus.prova.value}
              label="Nota Prova"
              color="#475569"
              formatValue={(v) => formatScore(v)}
              domain={[0, 10]}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Nota Voxia (%)</h3>
            <IndicatorTrendChart
              data={history ?? []}
              month={(m) => m.month}
              value={(m) => m.stats.voxiaScore}
              label="Nota Voxia"
              color="#e11d48"
              formatValue={(v) => `${formatScore(v)}%`}
              domain={[0, 100]}
            />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Desempenho Total</h3>
            <BonusTrendChart data={history ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}

const NOT_LAUNCHED_TIER: Tier = {
  label: "Não lançado",
  text: "text-slate-500",
  fill: "bg-slate-300",
  track: "bg-slate-100",
  chip: "bg-slate-100 text-slate-500",
};

function MeterCriterionCard({
  label,
  weight,
  earned,
  previousEarned,
  valueLabel,
  notLaunched = false,
}: {
  label: string;
  weight: number;
  earned: number;
  previousEarned?: number;
  valueLabel: string;
  notLaunched?: boolean;
}) {
  const ratio = weight > 0 ? (earned / weight) * 100 : 0;
  // Nao lancado ainda != nota baixa - usa um estado neutro em vez de
  // vermelho, pra nao parecer que o colaborador foi mal avaliado quando na
  // verdade o indicador so nao foi preenchido.
  const tier = notLaunched ? NOT_LAUNCHED_TIER : tierFor(ratio);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tier.chip}`}>{tier.label}</span>
      </div>
      <div className="mt-2 text-sm text-slate-500">{valueLabel}</div>
      <div className={`mt-3 h-2.5 w-full overflow-hidden rounded-full ${tier.track}`}>
        <div className={`h-full rounded-full ${tier.fill}`} style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <DeltaBadge current={earned} previous={previousEarned} format={(v) => `${v.toFixed(1)} pts`} />
        <span className="shrink-0 text-right text-sm font-semibold text-slate-700">
          {earned.toFixed(1)} / {weight} pts
        </span>
      </div>
    </div>
  );
}

function StatusCriterionCard({
  label,
  ok,
  weight,
  earned,
  previousEarned,
}: {
  label: string;
  ok: boolean;
  weight: number;
  earned: number;
  previousEarned?: number;
}) {
  const tier = ok
    ? { chip: "bg-emerald-50 text-emerald-700", icon: "✓", text: "Sem ocorrências" }
    : { chip: "bg-rose-50 text-rose-700", icon: "✕", text: "Com ocorrência no mês" };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-900/5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tier.chip}`}>
        <span className="text-base font-bold">{tier.icon}</span>
        {tier.text}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <DeltaBadge current={earned} previous={previousEarned} format={(v) => `${v} pts`} />
        <span className="shrink-0 text-right text-sm font-semibold text-slate-700">
          {earned} / {weight} pts
        </span>
      </div>
    </div>
  );
}

function DesempenhoTotalCard({
  total,
  previous,
  expanded,
  onToggle,
}: {
  total: number;
  previous?: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tier = tierFor(total);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex flex-col items-start rounded-2xl bg-white p-5 text-left shadow-card ring-1 ring-slate-900/5 transition-shadow hover:shadow-card-hover"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Desempenho Total</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      <div className={`mt-2 text-2xl font-bold ${tier.text}`}>{total.toFixed(1)}%</div>
      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${tier.chip}`}>
        {tier.label}
      </span>
      <div className="mt-1 text-xs">
        <DeltaBadge current={total} previous={previous} format={(v) => `${v.toFixed(1)} p.p.`} />
      </div>
    </button>
  );
}

function BonusCriteriaGrid({
  feedback,
  previousMonth,
}: {
  feedback: EmployeeFeedback;
  previousMonth?: EmployeeFeedbackMonth;
}) {
  const { bonus } = feedback;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MeterCriterionCard
          label={`Agendamentos (${bonus.agendamentos.weight}%)`}
          weight={bonus.agendamentos.weight}
          earned={bonus.agendamentos.earned}
          previousEarned={previousMonth?.bonus.agendamentos.earned}
          valueLabel={`${formatNumber(bonus.agendamentos.value)} de ${formatNumber(bonus.agendamentos.target)}`}
        />
        <MeterCriterionCard
          label={`Prova (${bonus.prova.weight}%)`}
          weight={bonus.prova.weight}
          earned={bonus.prova.earned}
          previousEarned={previousMonth?.bonus.prova.earned}
          valueLabel={bonus.prova.value !== null ? `${formatScore(bonus.prova.value)} de ${bonus.prova.target}` : "Não lançada"}
          notLaunched={bonus.prova.value === null}
        />
        <MeterCriterionCard
          label={`Nota Voxia (${bonus.voxia.weight}%)`}
          weight={bonus.voxia.weight}
          earned={bonus.voxia.earned}
          previousEarned={previousMonth?.bonus.voxia.earned}
          valueLabel={bonus.voxia.value !== null ? `${formatScore(bonus.voxia.value)}% de ${bonus.voxia.target}%` : "Não lançada"}
          notLaunched={bonus.voxia.value === null}
        />
        <StatusCriterionCard
          label={`Assiduidade (${bonus.assiduidade.weight}%)`}
          ok={bonus.assiduidade.ok}
          weight={bonus.assiduidade.weight}
          earned={bonus.assiduidade.earned}
          previousEarned={previousMonth?.bonus.assiduidade.earned}
        />
        <StatusCriterionCard
          label={`Penalidades (${bonus.penalidades.weight}%)`}
          ok={bonus.penalidades.ok}
          weight={bonus.penalidades.weight}
          earned={bonus.penalidades.earned}
          previousEarned={previousMonth?.bonus.penalidades.earned}
        />
      </div>
  );
}

