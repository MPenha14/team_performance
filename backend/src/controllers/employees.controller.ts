import { Request, Response } from "express";
import {
  createEmployee,
  deleteEmployee,
  EmployeeInput,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../services/employees.service";

function parseInput(req: Request): EmployeeInput {
  const body = req.body ?? {};
  return {
    name: body.name,
    role: body.role,
    team: body.team,
    email: body.email,
    phone: body.phone,
    avatarUrl: body.avatarUrl,
    active: body.active,
    admissionDate: body.admissionDate,
  };
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  const includeInactive = req.query.include_inactive !== "false";
  const team = (req.query.team as string) || undefined;
  const result = await listEmployees(includeInactive, team);
  res.json({ success: true, data: result });
}

export async function getEmployeeById(req: Request, res: Response): Promise<void> {
  const result = await getEmployee(req.params.id);
  res.json({ success: true, data: result });
}

export async function postEmployee(req: Request, res: Response): Promise<void> {
  const result = await createEmployee(parseInput(req));
  res.status(201).json({ success: true, data: result });
}

export async function putEmployee(req: Request, res: Response): Promise<void> {
  const result = await updateEmployee(req.params.id, parseInput(req));
  res.json({ success: true, data: result });
}

export async function deleteEmployeeById(req: Request, res: Response): Promise<void> {
  await deleteEmployee(req.params.id);
  res.json({ success: true, data: null });
}
