import { api } from "./api";
import { ApiEnvelope } from "../types/drclick";

interface LoginResponse {
  token: string;
}

export async function loginRequest(email: string, password: string): Promise<string> {
  const { data } = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  return data.data.token;
}
