import { Request, Response } from "express";
import { getMonthlyMetric, listMonthlyMetrics, upsertMonthlyMetric } from "../services/callCenterMetrics.service";

export async function getMetricsHistory(req: Request, res: Response): Promise<void> {
  const result = await listMonthlyMetrics();
  res.json({ success: true, data: result });
}

export async function getMetricByMonth(req: Request, res: Response): Promise<void> {
  const result = await getMonthlyMetric(req.params.month);
  res.json({ success: true, data: result });
}

export async function putMetricByMonth(req: Request, res: Response): Promise<void> {
  const { offeredCalls, answeredCalls, voxiaScore } = req.body ?? {};
  const result = await upsertMonthlyMetric(req.params.month, {
    offeredCalls: Number(offeredCalls) || 0,
    answeredCalls: Number(answeredCalls) || 0,
    voxiaScore: voxiaScore === null || voxiaScore === undefined || voxiaScore === "" ? null : Number(voxiaScore),
  });
  res.json({ success: true, data: result });
}
