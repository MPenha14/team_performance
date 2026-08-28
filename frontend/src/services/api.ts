import axios, { AxiosError } from "axios";
import { clearStoredToken, getStoredToken } from "../utils/tokenStorage";

// O frontend fala SOMENTE com o backend do Media Performance.
// Nenhuma credencial do Dr.Click existe neste arquivo ou em qualquer
// outro lugar do frontend - o backend e o unico intermediario seguro.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
  // Periodos longos podem levar mais de um minuto no Dr.Click - o timeout
  // aqui precisa ser maior que o do backend (120s) para nao cortar antes.
  timeout: 130000,
});

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiRequestError(
          "Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente."
        )
      );
    }

    if (error.response.status === 401 && !error.config?.url?.includes("/auth/login")) {
      clearStoredToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    const message =
      error.response.data?.message ||
      "Nao foi possivel consultar os dados do Dr.Click. Tente novamente.";

    return Promise.reject(new ApiRequestError(message, error.response.status));
  }
);
