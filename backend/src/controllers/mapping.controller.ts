import { Request, Response } from "express";
import { autoMapByName, deleteMapping, listMappings, setEmployeeMapping } from "../services/mapping.service";
import { parseClinicIds, parseDateRange } from "../utils/queryHelpers";

export async function getMappings(req: Request, res: Response): Promise<void> {
  const result = await listMappings();
  res.json({ success: true, data: result });
}

export async function deleteMappingById(req: Request, res: Response): Promise<void> {
  await deleteMapping(req.params.id);
  res.json({ success: true, data: null });
}

export async function putEmployeeMapping(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const result = await setEmployeeMapping(req.params.id, {
    drclickUserId: body.drclickUserId || null,
    drclickName: body.drclickName,
    drclickRole: body.drclickRole,
  });
  res.json({ success: true, data: result });
}

export async function postAutoMap(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = parseDateRange(req);
  const clinicIds = parseClinicIds(req);

  const result = await autoMapByName({ startDate, endDate, clinicIds });

  res.json({ success: true, data: result });
}
