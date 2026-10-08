import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  listEmployeeScoresForMonth,
  upsertEmployeeScore,
  UpsertEmployeeScoreInput,
} from "../services/employeeScores.service";

export async function getScoresForMonth(req: Request, res: Response): Promise<void> {
  const month = req.query.month as string;
  if (!month) {
    throw new AppError("Informe o mes (parametro month, formato AAAA-MM).", 400);
  }
  const result = await listEmployeeScoresForMonth(month);
  res.json({ success: true, data: result });
}

// Update parcial - so grava os campos que vierem no corpo da requisicao,
// para a tela de Indicadores Manuais (voxiaScore/answeredCalls) e a tela de
// Feedback (testScore/hasAbsenceOrLateness/hasPenalty, e tambem
// voxiaScore/answeredCalls) poderem editar o mesmo registro sem uma
// sobrescrever o que a outra gravou.
export async function putScoreByEmployeeMonth(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const input: UpsertEmployeeScoreInput = {};

  if ("voxiaScore" in body) {
    input.voxiaScore = body.voxiaScore === null || body.voxiaScore === "" ? null : Number(body.voxiaScore);
  }
  if ("answeredCalls" in body) {
    input.answeredCalls = Number(body.answeredCalls) || 0;
  }
  if ("testScore" in body) {
    input.testScore = body.testScore === null || body.testScore === "" ? null : Number(body.testScore);
  }
  if ("hasAbsenceOrLateness" in body) {
    input.hasAbsenceOrLateness = Boolean(body.hasAbsenceOrLateness);
  }
  if ("hasPenalty" in body) {
    input.hasPenalty = Boolean(body.hasPenalty);
  }

  const result = await upsertEmployeeScore(req.params.employeeId, req.params.month, input);
  res.json({ success: true, data: result });
}
