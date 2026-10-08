// Programa de bonificacao do Call Center - ver backend/src/services/bonusProgram.service.ts
// para a formula exata de cada criterio.

export interface BonusCriterion {
  weight: number;
  earned: number;
}

export interface BonusBreakdown {
  agendamentos: BonusCriterion & { value: number; target: number };
  assiduidade: BonusCriterion & { ok: boolean };
  penalidades: BonusCriterion & { ok: boolean };
  prova: BonusCriterion & { value: number | null; target: number };
  voxia: BonusCriterion & { value: number | null; target: number };
  total: number;
}

export interface EmployeeFeedbackStats {
  agendamentos: number;
  pacientesAtendidos: number;
  conversionRate: number | null;
  answeredCalls: number;
  voxiaScore: number | null;
}

export interface EmployeeFeedback {
  employee: { id: string; name: string; role: string };
  month: string;
  stats: EmployeeFeedbackStats;
  manual: {
    testScore: number | null;
    hasAbsenceOrLateness: boolean;
    hasPenalty: boolean;
  };
  bonus: BonusBreakdown;
}

// Um mes do historico de progresso (ver /feedback/:employeeId/history) -
// mesmos stats/bonus do mes atual, sem os dados manuais editaveis (que so
// fazem sentido no mes corrente).
export interface EmployeeFeedbackMonth {
  month: string;
  stats: EmployeeFeedbackStats;
  bonus: BonusBreakdown;
}
