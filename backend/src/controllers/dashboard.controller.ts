import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service";
import { parseClinicIds, parseDateRange } from "../utils/queryHelpers";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);

  const result = await getDashboardSummary({ startDate, endDate, clinicIds });

  res.json({ success: true, data: result });
}
