import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: "Rota nao encontrada.",
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, error);
    }
    res.status(error.statusCode).json({
      success: false,
      message: error.userMessage,
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    logger.error("Erro de banco de dados", error);
    res.status(503).json({
      success: false,
      message: "Não foi possível conectar ao banco de dados. Verifique a configuração e tente novamente.",
    });
    return;
  }

  logger.error("Erro nao tratado", error);
  res.status(500).json({
    success: false,
    message: "Ocorreu um erro inesperado no servidor. Tente novamente.",
  });
}

// Envolve controllers assincronos para encaminhar erros ao errorHandler
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
