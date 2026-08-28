import { Request } from "express";
import { AppError } from "./AppError";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ParsedDateRange {
  startDate: string;
  endDate: string;
}

// Le start_date/end_date da query string. Quando ausentes, usa o dia atual.
export function parseDateRange(req: Request): ParsedDateRange {
  const startDate = (req.query.start_date as string) || todayIso();
  const endDate = (req.query.end_date as string) || startDate;
  return { startDate, endDate };
}

// Le a lista de clinicas da query string (idclinica ou clinic_ids),
// separada por virgula. Retorna undefined se nao informado (usa default do servidor).
export function parseClinicIds(req: Request): string[] | undefined {
  const raw = (req.query.idclinica as string) || (req.query.clinic_ids as string);
  if (!raw) return undefined;
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export function parsePagination(req: Request): { page?: number; pageSize?: number } {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

  if (page !== undefined && (Number.isNaN(page) || page < 1)) {
    throw new AppError("Parametro 'page' invalido.", 400);
  }
  if (pageSize !== undefined && (Number.isNaN(pageSize) || pageSize < 1)) {
    throw new AppError("Parametro 'pageSize' invalido.", 400);
  }

  return { page, pageSize };
}
