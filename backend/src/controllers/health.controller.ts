import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { env } from "../config/env";

export async function getHealth(req: Request, res: Response): Promise<void> {
  let databaseOk = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseOk = false;
  }

  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: databaseOk ? "connected" : "unavailable",
      drclickConfigured: Boolean(env.drclick.token || env.drclick.authorization),
      clinicsConfigured: env.drclick.clinicIds.length,
    },
  });
}
