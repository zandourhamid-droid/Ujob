import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ujobsRouter from "./ujobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ujobsRouter);

export default router;
