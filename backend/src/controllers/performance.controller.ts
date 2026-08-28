import { Request, Response } from "express";
import { getPerformanceByUserId, listPerformance } from "../services/performance.service";
import { getPerformanceHistory } from "../services/history.service";
import { parseClinicIds, parseDateRange } from "../utils/queryHelpers";

export async function getPerformance(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);
  const role = (req.query.role as string) || undefined;
  const employeeId = (req.query.employee_id as string) || undefined;
  const includeInactive = req.query.include_inactive === "true";
  const team = (req.query.team as string) || undefined;

  const result = await listPerformance({
    startDate,
    endDate,
    clinicIds,
    role,
    employeeId,
    includeInactive,
    team,
  });

  res.json({ success: true, data: result });
}

export async function getPerformanceById(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);
  const { employeeId } = req.params;

  const result = await getPerformanceByUserId(employeeId, { startDate, endDate, clinicIds });

  res.json({ success: true, data: result });
}

export async function getPerformanceHistoryById(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const { employeeId } = req.params;

  const result = await getPerformanceHistory(employeeId, startDate, endDate);

  res.json({ success: true, data: result });
}
