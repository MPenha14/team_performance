// Dados manuais lancados individualmente por colaborador do Call Center,
// por mes - usados na tela "Indicadores Manuais" (chamadas atendidas e Nota
// Voxia) e na tela "Feedback" do programa de bonificação (Prova,
// Assiduidade, Penalidades).

export interface EmployeeScore {
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  voxiaScore: number | null;
  answeredCalls: number;
  testScore: number | null;
  hasAbsenceOrLateness: boolean;
  hasPenalty: boolean;
}

// Update parcial - so inclui os campos que estao de fato sendo editados.
export interface EmployeeScoreInput {
  voxiaScore?: number | null;
  answeredCalls?: number;
  testScore?: number | null;
  hasAbsenceOrLateness?: boolean;
  hasPenalty?: boolean;
}
