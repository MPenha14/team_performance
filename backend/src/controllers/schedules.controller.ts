import { Request, Response } from "express";
import { listSchedules } from "../services/schedule.service";
import { parseClinicIds, parseDateRange, parsePagination } from "../utils/queryHelpers";
import { StatementItem } from "../types/drclick";

const SORTABLE_FIELDS: Array<keyof StatementItem> = [
  "status",
  "statusText",
  "creationDate",
  "scheduleDate",
  "patient",
  "professional",
  "category",
  "service",
  "convenio",
  "value",
  "health_plan_value",
];

export async function getSchedules(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);
  const { page, pageSize } = parsePagination(req);

  const status = (req.query.status as string) || undefined;
  const search = (req.query.search as string) || undefined;
  const sortByRaw = (req.query.sortBy as string) || undefined;
  const sortBy = SORTABLE_FIELDS.includes(sortByRaw as keyof StatementItem)
    ? (sortByRaw as keyof StatementItem)
    : undefined;
  const sortDirection = req.query.sortDirection === "desc" ? "desc" : "asc";

  const result = await listSchedules({
    startDate,
    endDate,
    clinicIds,
    status,
    search,
    sortBy,
    sortDirection,
    page,
    pageSize,
  });

  res.json({ success: true, data: result });
}
