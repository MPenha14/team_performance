import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl,
    })
  );
  app.use(express.json());

  app.use("/api", router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
