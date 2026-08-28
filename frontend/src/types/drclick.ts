// Tipos que espelham EXATAMENTE o retorno da API do Dr.Click (via backend).
// Nao adicionar campos calculados aqui - apenas o shape real dos dados.

export interface ScheduleSummary {
  cons: number;
  exam: number;
  proc: number;
  ret: number;
}

export interface MainSummary {
  users: number;
  userIds: string[];
  schedules: ScheduleSummary;
  patientsIds: string[];
  newPatientsIds: string[];
  patients: number;
  newPatients: number;
  revenue: number;
  serviceorder_amount: number;
  serviceorder_billed: number;
}

export interface ServiceChannelSummaryItem {
  name: string;
  count: number;
  revenue?: number;
}

export interface ServiceOriginSummaryItem {
  name: string;
  count: number;
}

export interface Summary {
  mainSummary: MainSummary;
  serviceChannelSummary: ServiceChannelSummaryItem[];
  serviceOriginSummary: ServiceOriginSummaryItem[];
}

export interface StatementItem {
  status: string;
  statusText: string;
  creationDate: string;
  scheduleDate: string;
  patient: string;
  professional: string;
  category: string;
  service: string;
  convenio: string;
  idordemservico: string;
  value: number;
  health_plan_value: number;
}

export interface MappedAccount {
  userId: string;
  name: string;
}

export interface EmployeePerformance {
  employeeId: string;
  name: string;
  role: string;
  team: string;
  active: boolean;
  avatarUrl: string | null;
  patients: number;
  newPatients: number;
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  totalSchedules: number;
  attendedSchedules: number;
  conversionRate: number | null;
  combos: number;
  revenue: number;
  serviceorderAmount: number;
  serviceorderBilled: number;
  amountPlan: number;
  // Recebimento antecipado - so preenchido para colaboradores da equipe
  // Midias Sociais (0 para os demais).
  advancePayment: number;
  mappedAccounts: MappedAccount[];
}

export interface PerformanceListResponse {
  summary: Summary;
  employees: EmployeePerformance[];
}

export interface PerformanceDetailResponse {
  employee: EmployeePerformance;
  channels: ServiceChannelSummaryItem[];
  origins: ServiceOriginSummaryItem[];
}

export interface PaginatedSchedules {
  items: StatementItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClinicInfo {
  id: string;
  name: string;
}

export interface HistoryPoint {
  date: string;
  patients: number;
  consultations: number;
  exams: number;
  procedures: number;
  returns: number;
  revenue: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
