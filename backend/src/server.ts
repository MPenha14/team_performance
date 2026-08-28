import { createApp } from "./app";
import { env } from "./config/env";
import { startScheduler } from "./jobs/scheduler";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Media Performance backend rodando na porta ${env.port} (${env.nodeEnv})`);
  startScheduler();
});
