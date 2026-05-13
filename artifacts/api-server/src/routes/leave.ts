import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, leaveRequestsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post(
  "/leave/request",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const { type, startDate, endDate, days, reason } = req.body ?? {};

    if (!type || !startDate || !endDate || !days || !reason?.trim()) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      res.status(400).json({ error: "End date cannot be before start date." });
      return;
    }

    const [row] = await db
      .insert(leaveRequestsTable)
      .values({ userId, type, startDate, endDate, days: Number(days), reason: reason.trim() })
      .returning();

    req.log.info({ userId, type, days }, "leave-request-submitted");
    res.status(201).json(row);
  }
);

router.get(
  "/leave/my-requests",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const rows = await db
      .select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.userId, userId))
      .orderBy(desc(leaveRequestsTable.createdAt))
      .limit(50);
    res.json(rows);
  }
);

router.get(
  "/leave/all",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const rows = await db
      .select({
        id: leaveRequestsTable.id,
        userId: leaveRequestsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        type: leaveRequestsTable.type,
        startDate: leaveRequestsTable.startDate,
        endDate: leaveRequestsTable.endDate,
        days: leaveRequestsTable.days,
        reason: leaveRequestsTable.reason,
        status: leaveRequestsTable.status,
        reviewNote: leaveRequestsTable.reviewNote,
        reviewedAt: leaveRequestsTable.reviewedAt,
        createdAt: leaveRequestsTable.createdAt,
      })
      .from(leaveRequestsTable)
      .innerJoin(usersTable, eq(usersTable.id, leaveRequestsTable.userId))
      .orderBy(desc(leaveRequestsTable.createdAt))
      .limit(200);
    res.json(rows);
  }
);

router.patch(
  "/leave/:id/approve",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    const reviewerId = req.currentUser!.id;
    const { reviewNote } = req.body ?? {};

    const existing = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.id, id)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Leave request not found." }); return; }
    if (existing[0].status !== "pending") { res.status(409).json({ error: "Already reviewed." }); return; }

    const [updated] = await db
      .update(leaveRequestsTable)
      .set({ status: "approved", reviewedBy: reviewerId, reviewedAt: new Date(), reviewNote: reviewNote ?? null })
      .where(eq(leaveRequestsTable.id, id))
      .returning();

    req.log.info({ id, reviewerId }, "leave-approved");
    res.json(updated);
  }
);

router.patch(
  "/leave/:id/reject",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    const reviewerId = req.currentUser!.id;
    const { reviewNote } = req.body ?? {};

    const existing = await db.select().from(leaveRequestsTable).where(eq(leaveRequestsTable.id, id)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Leave request not found." }); return; }
    if (existing[0].status !== "pending") { res.status(409).json({ error: "Already reviewed." }); return; }

    const [updated] = await db
      .update(leaveRequestsTable)
      .set({ status: "rejected", reviewedBy: reviewerId, reviewedAt: new Date(), reviewNote: reviewNote ?? null })
      .where(eq(leaveRequestsTable.id, id))
      .returning();

    req.log.info({ id, reviewerId }, "leave-rejected");
    res.json(updated);
  }
);

export default router;
