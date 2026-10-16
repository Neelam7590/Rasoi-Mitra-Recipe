import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Resolved from either artifacts/api-server/src or artifacts/api-server/dist,
// so this works both from source and from the bundled output.
const webDistDir = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "rasoi-mitra",
  "dist",
  "public",
);

if (existsSync(webDistDir)) {
  app.use(express.static(webDistDir));

  // Client-side routing (for example /favorites) needs the SPA entrypoint.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(webDistDir, "index.html"));
  });
} else {
  logger.warn(
    { webDistDir },
    "Web build not found; serving the API only",
  );
}

export default app;
