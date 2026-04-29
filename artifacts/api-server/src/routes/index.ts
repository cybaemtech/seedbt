import { Router, type IRouter } from "express";
import healthRouter from "./health";
import assetsRouter from "./assets";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";
import movementsRouter from "./movements";
import locationsRouter from "./locations";
import analyticsRouter from "./analytics";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(historyRouter);
router.use(dashboardRouter);
router.use(movementsRouter);
router.use(locationsRouter);
router.use(analyticsRouter);
router.use(reportsRouter);

export default router;
