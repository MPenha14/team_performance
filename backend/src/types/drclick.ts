// Tipos que espelham EXATAMENTE o retorno da API do Dr.Click.
// Nao adicionar campos calculados aqui - apenas o shape real da API.

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
  // Faturamento previsto (amount_bill_forecast) desse status, quando vem de
  // /appointmentbystatus. Ausente para canais/origens (nao se aplica).
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

export interface RoleStatementUser {
  name: string;
  user_id: string;
  patients: number;
  schedules: ScheduleSummary;
  combos: number;
  revenue: number;
  idsordemdeservico: string[];
  serviceorder_amount: number;
  serviceorder_billed: number;
  amoun_plan: number;
}

export interface RoleStatementGroup {
  role: string;
  users: RoleStatementUser[];
}

export interface SchedulesOfDayData {
  summary: Summary;
  statement: StatementItem[];
  roleStatement: RoleStatementGroup[];
  roleStatementReordered: RoleStatementGroup[];
}

export interface SchedulesOfDayResponse {
  success: boolean;
  data: SchedulesOfDayData;
}

export interface SchedulesOfDayParams {
  start_date: string;
  end_date: string;
  idclinica: string;
  idcanalatendimento?: string;
  // Filtra a resposta inteira (summary/roleStatement/statement) para UM
  // colaborador (user_id do Dr.Click). Nao documentado oficialmente, mas
  // confirmado funcionando - reduz o payload de ~9MB/dia (clinica inteira)
  // para poucos KB (so os registros desse colaborador).
  user?: string;
}

// Tipos do endpoint /api/reports/appointmentbystatus - usado apenas para
// saber quantos agendamentos de cada colaborador estao com status
// "atendido" no periodo (contagem por DATA DO AGENDAMENTO, diferente de
// /schedulesofday que conta por data de criacao/movimentacao).
export interface ServiceStatusItem {
  name: string;
  amount: number;
  amount_bill_forecast?: number;
}

export interface AppointmentByStatusUserResult {
  user_name: string;
  user_id: string;
  role_name: string;
  services_total: number;
  total_patients: number;
  services_by_type_items: { name: string; amount: number }[];
  services_by_status: ServiceStatusItem[];
}

export interface ServiceGeneral {
  total_patients: number;
  total_services_by_type_items: number;
  total_services_by_status: number;
  services_by_type_items: { name: string; amount: number }[];
  services_by_status: ServiceStatusItem[];
}

export interface AppointmentByStatusData {
  service_general: ServiceGeneral;
  user_results: AppointmentByStatusUserResult[];
}

export interface AppointmentByStatusResponse {
  success: boolean;
  data: AppointmentByStatusData;
}

export interface AppointmentByStatusParams {
  start_date: string;
  end_date: string;
  idclinica: string;
  // idusuario e' opcional: quando omitido e idcanalatendimento e' informado,
  // service_general traz o agregado de todo o canal (nao precisa de uma
  // chamada por colaborador).
  idusuario?: string;
  idcanalatendimento?: string;
}

// Tipos do endpoint /api/reports/users-performance - usado para o
// "Recebimento Antecipado" (total_amount_billed) dos colaboradores de
// Midias Sociais/Comercial. O campo "data" (lista de os_ids por
// agendamento) nao e' usado - so o total agregado por role interessa.
export interface UsersPerformanceRoleGroup {
  role: string;
  total_amount_billed: number;
  total_amount_plan: number;
  total_appointments: number;
  total_orders: number;
  tipo_visualizacao: string;
}

export interface UsersPerformanceData {
  groupByRoleResponse: UsersPerformanceRoleGroup[];
}

export interface UsersPerformanceResponse {
  success: boolean;
  data: UsersPerformanceData;
}

export interface UsersPerformanceParams {
  idclinica: string;
  idusuario: string;
  start_date: string;
  end_date: string;
  page?: number;
  limit?: number;
}
