import cron from "node-cron";
import { env } from "../config/env";
import { runSync } from "../services/sync.service";
import { logger } from "../utils/logger";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Sincronizacao automatica periodica (padrao: a cada 15 minutos),
// sincronizando o dia atual. Tambem exposta via POST /api/sync
// para sincronizacao manual ("Sincronizar agora").
export function startScheduler(): void {
  if (!env.sync.enabled) {
    logger.info("Sincronizacao automatica desabilitada (SYNC_CRON_ENABLED=false)");
    return;
  }

  cron.schedule(env.sync.cronExpression, async () => {
    const date = todayIso();
    try {
      logger.info(`Iniciando sincronizacao automatica para ${date}`);
      const result = await runSync({ startDate: date, endDate: date });
      logger.info(`Sincronizacao automatica concluida: ${result.recordsSynced} registros`);
    } catch (error) {
      logger.error("Falha na sincronizacao automatica", error);
    }
  });

  logger.info(`Sincronizacao automatica agendada: ${env.sync.cronExpression}`);
}
