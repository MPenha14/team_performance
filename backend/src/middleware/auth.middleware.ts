import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/auth.service";
import { AppError } from "../utils/AppError";

// Protege as rotas da API - exige um token JWT valido (emitido em
// POST /api/auth/login) no header Authorization: Bearer <token>.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    throw new AppError("Nao autenticado. Faca login para continuar.", 401);
  }

  verifyToken(token);
  next();
}
