import { Request, Response } from "express";
import { login } from "../services/auth.service";
import { AppError } from "../utils/AppError";

export async function postLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    throw new AppError("Informe e-mail e senha.", 400);
  }

  const result = login(String(email), String(password));

  res.json({ success: true, data: result });
}
