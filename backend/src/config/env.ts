import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",

  databaseUrl: required("DATABASE_URL"),

  drclick: {
    apiUrl: required("DRCLICK_API_URL", "https://api-maissaude.drclick.com.br"),
    token: process.env.DRCLICK_TOKEN ?? "",
    authorization: process.env.DRCLICK_AUTHORIZATION ?? "",
    clinicIds: (process.env.DRCLICK_CLINIC_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    // ID do canal de atendimento "Telefonia" (idcanalatendimento) - usado
    // para restringir o Dashboard a esse canal direto na API, sem precisar
    // trazer os dados da clinica inteira.
    telefoniaChannelId: process.env.DRCLICK_TELEFONIA_CHANNEL_ID ?? "",
  },

  sync: {
    enabled: (process.env.SYNC_CRON_ENABLED ?? "true") === "true",
    cronExpression: process.env.SYNC_CRON_EXPRESSION ?? "*/15 * * * *",
  },

  auth: {
    adminEmail: required("ADMIN_EMAIL"),
    adminPassword: required("ADMIN_PASSWORD"),
    jwtSecret: required("JWT_SECRET"),
  },
};
