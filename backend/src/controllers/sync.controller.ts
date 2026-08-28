import { Request, Response } from "express";
import { listSyncLogs, runSync } from "../services/sync.service";
import { AppError } from "../utils/AppError";

export async function postSync(req: Request, res: Response): Promise<void> {
  const startDate = req.body?.start_date as string | undefined;
  const endDate = req.body?.end_date as string | undefined;
  const clinicIds = req.body?.clinic_ids as string[] | undefined;

  if (!startDate || !endDate) {
    throw new AppError(
      "Informe start_date e end_date no corpo da requisicao para sincronizar.",
      400
    );
  }

  const result = await runSync({ startDate, endDate, clinicIds });

  res.json({ success: true, data: result });
}

export async function getSyncLogs(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const result = await listSyncLogs(limit);
  res.json({ success: true, data: result });
}
