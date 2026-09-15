import { Request, Response } from "express";
import { listClinics, updateClinicName } from "../services/clinics.service";

export async function getClinics(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: await listClinics() });
}

export async function putClinic(req: Request, res: Response): Promise<void> {
  const { name } = req.body ?? {};
  const result = await updateClinicName(req.params.id, name);
  res.json({ success: true, data: result });
}
