// Indicadores do Call Center lancados manualmente (nao vem da API do
// Dr.Click). Lancamento e por MES - o usuario seleciona o mes e preenche os
// valores daquele mes inteiro.

export interface CallCenterMonthlyMetric {
  month: string; // YYYY-MM
  offeredCalls: number;
  answeredCalls: number;
  voxiaScore: number | null;
}

export interface ManualIndicatorsSummary {
  offeredCalls: number;
  answeredCalls: number;
  serviceLevel: number | null;
  voxiaScore: number | null;
}
