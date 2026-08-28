import { Request, Response } from "express";
import { listClinics } from "../services/clinics.service";

export function getClinics(req: Request, res: Response): void {
  res.json({ success: true, data: listClinics() });
}
