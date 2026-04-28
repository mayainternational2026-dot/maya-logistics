import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import shipmentsRouter from "./shipments";
import dashboardRouter from "./dashboard";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(shipmentsRouter);
router.use(dashboardRouter);
router.use(contactRouter);

export default router;
