import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({
    status: process.env.OPENAI_API_KEY ? "ok" : "needs_openai_key",
  });
  res.json(data);
});

export default router;
