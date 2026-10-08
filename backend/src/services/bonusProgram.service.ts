// Calculo do programa de bonificacao do Call Center. Puramente aritmetico -
// nao acessa banco nem API, so recebe os numeros ja apurados (automaticos +
// manuais) e devolve a pontuacao de cada criterio e o Desempenho Total.
//
// Criterios (soma = Desempenho Total, ate 100%):
//   Agendamentos  40% - meta 900/mes, abaixo disso proporcional
//   Assiduidade    5% - falta/atraso sem justificativa no mes zera o criterio
//   Penalidades    5% - penalidade no mes zera o criterio
//   Prova         20% - nota 0-10, nota 10 = pontuacao cheia, abaixo proporcional
//   Nota Voxia    30% - percentual 0-100 (nota INDIVIDUAL por colaborador,
//   diferente da Nota Voxia GERAL do time que e 0-10), 100% = pontuacao
//   cheia, abaixo proporcional

export const BONUS_WEIGHTS = {
  agendamentos: 40,
  assiduidade: 5,
  penalidades: 5,
  prova: 20,
  voxia: 30,
} as const;

export const AGENDAMENTOS_TARGET = 900;
export const PROVA_TARGET = 10;
export const VOXIA_TARGET = 100;

export interface BonusCriterionResult {
  weight: number;
  earned: number;
}

export interface BonusBreakdown {
  agendamentos: BonusCriterionResult & { value: number; target: number };
  assiduidade: BonusCriterionResult & { ok: boolean };
  penalidades: BonusCriterionResult & { ok: boolean };
  prova: BonusCriterionResult & { value: number | null; target: number };
  voxia: BonusCriterionResult & { value: number | null; target: number };
  total: number;
}

export interface BonusInput {
  agendamentos: number;
  hasAbsenceOrLateness: boolean;
  hasPenalty: boolean;
  prova: number | null;
  voxiaScore: number | null;
}

function proportional(value: number, target: number, weight: number): number {
  if (target <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, value) / target);
  return ratio * weight;
}

export function calculateBonus(input: BonusInput): BonusBreakdown {
  const agendamentosEarned = proportional(input.agendamentos, AGENDAMENTOS_TARGET, BONUS_WEIGHTS.agendamentos);
  const assiduidadeEarned = input.hasAbsenceOrLateness ? 0 : BONUS_WEIGHTS.assiduidade;
  const penalidadesEarned = input.hasPenalty ? 0 : BONUS_WEIGHTS.penalidades;
  const provaEarned = input.prova !== null ? proportional(input.prova, PROVA_TARGET, BONUS_WEIGHTS.prova) : 0;
  const voxiaEarned =
    input.voxiaScore !== null ? proportional(input.voxiaScore, VOXIA_TARGET, BONUS_WEIGHTS.voxia) : 0;

  return {
    agendamentos: {
      value: input.agendamentos,
      target: AGENDAMENTOS_TARGET,
      weight: BONUS_WEIGHTS.agendamentos,
      earned: agendamentosEarned,
    },
    assiduidade: { ok: !input.hasAbsenceOrLateness, weight: BONUS_WEIGHTS.assiduidade, earned: assiduidadeEarned },
    penalidades: { ok: !input.hasPenalty, weight: BONUS_WEIGHTS.penalidades, earned: penalidadesEarned },
    prova: { value: input.prova, target: PROVA_TARGET, weight: BONUS_WEIGHTS.prova, earned: provaEarned },
    voxia: { value: input.voxiaScore, target: VOXIA_TARGET, weight: BONUS_WEIGHTS.voxia, earned: voxiaEarned },
    total: agendamentosEarned + assiduidadeEarned + penalidadesEarned + provaEarned + voxiaEarned,
  };
}
