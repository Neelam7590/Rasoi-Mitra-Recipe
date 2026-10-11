import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rasoiMitraRouter from "./rasoi-mitra";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rasoiMitraRouter);

export default router;
