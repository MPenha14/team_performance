import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const TOKEN_TTL = "12h";

export interface AuthTokenPayload {
  email: string;
}

// Compara em tempo constante para nao vazar, por timing, quanto do
// email/senha digitado bate com o valor configurado.
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

// Login unico (usuario admin fixo, configurado via env) - nao ha cadastro
// de multiplos usuarios neste sistema.
export function login(email: string, password: string): { token: string } {
  const validEmail = safeEqual(email.trim().toLowerCase(), env.auth.adminEmail.trim().toLowerCase());
  const validPassword = safeEqual(password, env.auth.adminPassword);

  if (!validEmail || !validPassword) {
    throw new AppError("E-mail ou senha incorretos.", 401);
  }

  const token = jwt.sign({ email: env.auth.adminEmail } as AuthTokenPayload, env.auth.jwtSecret, {
    expiresIn: TOKEN_TTL,
  });

  return { token };
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, env.auth.jwtSecret) as AuthTokenPayload;
  } catch {
    throw new AppError("Sessao invalida ou expirada. Faca login novamente.", 401);
  }
}
