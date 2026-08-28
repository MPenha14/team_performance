import { Request, Response } from "express";
import { listUsers } from "../services/users.service";
import { parseClinicIds, parseDateRange } from "../utils/queryHelpers";

export async function getUsers(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);

  const result = await listUsers({ startDate, endDate, clinicIds });

  res.json({ success: true, data: result });
}
