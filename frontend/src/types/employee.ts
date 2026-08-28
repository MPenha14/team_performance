export type Team = "CALL_CENTER" | "MIDIAS_SOCIAIS";

export interface DrClickMappingInfo {
  id: string;
  employeeId: string;
  drclickUserId: string;
  drclickName: string;
  drclickRole: string | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  team: Team;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  active: boolean;
  admissionDate: string | null;
  createdAt: string;
  updatedAt: string;
  mappings: DrClickMappingInfo[];
}

export interface EmployeeInput {
  name: string;
  role: string;
  team?: Team;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  active?: boolean;
  admissionDate?: string | null;
}

export interface MappingWithEmployee extends DrClickMappingInfo {
  employee: Employee;
}

export interface DrClickDirectoryUser {
  userId: string;
  name: string;
  role: string;
}

export interface SyncLogEntry {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  recordsSynced: number;
  message: string | null;
  durationSeconds: number | null;
}
