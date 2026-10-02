import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { listEmployeeScoresForMonth, upsertEmployeeScore } from "../services/employeeScores.service";

export async function getScoresForMonth(req: Request, res: Response): Promise<void> {
  const month = req.query.month as string;
  if (!month) {
    throw new AppError("Informe o mes (parametro month, formato AAAA-MM).", 400);
  }
  const result = await listEmployeeScoresForMonth(month);
  res.json({ success: true, data: result });
}

export async function putScoreByEmployeeMonth(req: Request, res: Response): Promise<void> {
  const { score, answeredCalls } = req.body ?? {};
  const result = await upsertEmployeeScore(req.params.employeeId, req.params.month, {
    score: score === null || score === undefined || score === "" ? null : Number(score),
    answeredCalls: Number(answeredCalls) || 0,
  });
  res.json({ success: true, data: result });
}
