// Nota manual lancada individualmente por colaborador do Call Center, por
// mes - lancamento independente dos indicadores agregados do time.

export interface EmployeeScore {
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  score: number | null;
  answeredCalls: number;
}
