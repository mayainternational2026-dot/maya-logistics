import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import shipmentsRouter from "./shipments";
import dashboardRouter from "./dashboard";
import contactRouter from "./contact";
import inquiriesRouter from "./inquiries";
import attendanceRouter from "./attendance";
import leaveRouter from "./leave";
import workLogRouter from "./workLog";
import shippingRatesRouter from "./shippingRates";
import expensesRouter from "./expenses";
import customerOrdersRouter from "./customerOrders";
import productSourcingRouter from "./productSourcing";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(shipmentsRouter);
router.use(dashboardRouter);
router.use(contactRouter);
router.use(inquiriesRouter);
router.use(attendanceRouter);
router.use(leaveRouter);
router.use(workLogRouter);
router.use(shippingRatesRouter);
router.use(expensesRouter);
router.use(customerOrdersRouter);
router.use(productSourcingRouter);
router.use(storageRouter);

export default router;
