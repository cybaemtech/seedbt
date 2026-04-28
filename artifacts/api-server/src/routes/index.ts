import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(historyRouter);
router.use(dashboardRouter);

export default router;
