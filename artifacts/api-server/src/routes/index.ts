import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import accountsRouter from "./accounts";
import transactionsRouter from "./transactions";
import cardsRouter from "./cards";
import loginEventsRouter from "./loginEvents";
import auditLogsRouter from "./auditLogs";
import pinChangesRouter from "./pinChanges";
import pwaEventsRouter from "./pwaEvents";
import settingsRouter from "./settings";
import radicadosRouter from "./radicados";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(accountsRouter);
router.use(transactionsRouter);
router.use(cardsRouter);
router.use(loginEventsRouter);
router.use(auditLogsRouter);
router.use(pinChangesRouter);
router.use(pwaEventsRouter);
router.use(settingsRouter);
router.use(radicadosRouter);

export default router;
