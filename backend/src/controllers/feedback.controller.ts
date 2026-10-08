import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getEmployeeFeedback, getEmployeeFeedbackHistory } from "../services/feedback.service";

export async function getFeedback(req: Request, res: Response): Promise<void> {
  const month = req.query.month as string;
  if (!month) {
    throw new AppError("Informe o mes (parametro month, formato AAAA-MM).", 400);
  }
  const result = await getEmployeeFeedback(req.params.employeeId, month);
  res.json({ success: true, data: result });
}

export async function getFeedbackHistory(req: Request, res: Response): Promise<void> {
  const month = req.query.month as string;
  if (!month) {
    throw new AppError("Informe o mes (parametro month, formato AAAA-MM).", 400);
  }
  const months = req.query.months ? Number(req.query.months) : 6;
  const result = await getEmployeeFeedbackHistory(req.params.employeeId, month, months);
  res.json({ success: true, data: result });
}
