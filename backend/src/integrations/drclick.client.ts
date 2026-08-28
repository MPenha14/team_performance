import axios, { AxiosError, AxiosInstance } from "axios";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import {
  AppointmentByStatusParams,
  AppointmentByStatusResponse,
  SchedulesOfDayParams,
  SchedulesOfDayResponse,
  UsersPerformanceParams,
  UsersPerformanceResponse,
} from "../types/drclick";

// Cliente HTTP para a API do Dr.Click.
// O token/Authorization SOMENTE existe aqui, no backend, via variaveis
// de ambiente. O frontend nunca tem acesso a este cliente ou as credenciais.
function buildClient(): AxiosInstance {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (env.drclick.authorization) {
    headers.Authorization = env.drclick.authorization.startsWith("Bearer ")
      ? env.drclick.authorization
      : `Bearer ${env.drclick.authorization}`;
  } else if (env.drclick.token) {
    headers.Authorization = `Bearer ${env.drclick.token}`;
  }

  return axios.create({
    baseURL: env.drclick.apiUrl,
    // Periodos maiores retornam payloads muito grandes (ex: ~87MB/64s para
    // 14 dias) - o timeout precisa acomodar isso, nao so consultas de 1 dia.
    timeout: 120000,
    maxContentLength: 300 * 1024 * 1024,
    maxBodyLength: 300 * 1024 * 1024,
    headers,
  });
}

const client = buildClient();

export async function fetchSchedulesOfDay(
  params: SchedulesOfDayParams
): Promise<SchedulesOfDayResponse> {
  if (!env.drclick.token && !env.drclick.authorization) {
    throw new AppError(
      "Credenciais do Dr.Click nao configuradas no servidor. Configure DRCLICK_TOKEN ou DRCLICK_AUTHORIZATION.",
      500
    );
  }

  try {
    const response = await client.get<SchedulesOfDayResponse>(
      "/api/reports/schedulesofday",
      { params }
    );

    if (!response.data) {
      throw new AppError(
        "A API do Dr.Click retornou uma resposta vazia.",
        502
      );
    }

    return response.data;
  } catch (error) {
    throw translateDrClickError(error);
  }
}

// Agendamentos por status (ex: "atendido") de UM colaborador, contados pela
// data do agendamento (scheduleDate) - diferente de /schedulesofday, que
// conta por data de criacao/movimentacao. Usado para "Agendamentos
// Atendidos" e "Conversao" na tela de Performance.
export async function fetchAppointmentsByStatus(
  params: AppointmentByStatusParams
): Promise<AppointmentByStatusResponse> {
  if (!env.drclick.token && !env.drclick.authorization) {
    throw new AppError(
      "Credenciais do Dr.Click nao configuradas no servidor. Configure DRCLICK_TOKEN ou DRCLICK_AUTHORIZATION.",
      500
    );
  }

  try {
    const response = await client.get<AppointmentByStatusResponse>(
      "/api/reports/appointmentbystatus",
      { params }
    );

    if (!response.data) {
      throw new AppError("A API do Dr.Click retornou uma resposta vazia.", 502);
    }

    return response.data;
  } catch (error) {
    throw translateDrClickError(error);
  }
}

// Recebimento antecipado (total_amount_billed) de UM colaborador, usado
// pelos colaboradores de Midias Sociais/Comercial - nao existe para o
// canal Telefonia (Call Center), que usa outros indicadores.
export async function fetchUsersPerformance(
  params: UsersPerformanceParams
): Promise<UsersPerformanceResponse> {
  if (!env.drclick.token && !env.drclick.authorization) {
    throw new AppError(
      "Credenciais do Dr.Click nao configuradas no servidor. Configure DRCLICK_TOKEN ou DRCLICK_AUTHORIZATION.",
      500
    );
  }

  try {
    const response = await client.get<UsersPerformanceResponse>(
      "/api/reports/users-performance",
      { params }
    );

    if (!response.data) {
      throw new AppError("A API do Dr.Click retornou uma resposta vazia.", 502);
    }

    return response.data;
  } catch (error) {
    throw translateDrClickError(error);
  }
}

function translateDrClickError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.code === "ECONNABORTED") {
      logger.error("Timeout ao consultar a API do Dr.Click", axiosError.message);
      return new AppError(
        "A consulta ao Dr.Click demorou demais para responder. Períodos muito longos podem levar vários minutos ou falhar - tente um período mais curto (até 30 dias) ou tente novamente.",
        504
      );
    }

    if (!axiosError.response) {
      logger.error("API do Dr.Click indisponivel", axiosError.message);
      return new AppError(
        "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.",
        503
      );
    }

    const status = axiosError.response.status;

    if (status === 401) {
      logger.error("Erro de autenticacao (401) na API do Dr.Click");
      return new AppError(
        "Falha de autenticacao com o Dr.Click. Verifique as credenciais configuradas no servidor.",
        401
      );
    }

    if (status === 403) {
      logger.error("Acesso negado (403) na API do Dr.Click");
      return new AppError(
        "Acesso negado pela API do Dr.Click para o recurso solicitado.",
        403
      );
    }

    if (status === 404) {
      return new AppError(
        "Recurso nao encontrado na API do Dr.Click.",
        404
      );
    }

    if (status >= 500) {
      logger.error("Erro interno da API do Dr.Click", status);
      return new AppError(
        "O servidor do Dr.Click apresentou um erro. Tente novamente mais tarde.",
        502
      );
    }

    return new AppError(
      "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.",
      status
    );
  }

  logger.error("Erro desconhecido ao consultar o Dr.Click", error);
  return new AppError(
    "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.",
    500
  );
}
