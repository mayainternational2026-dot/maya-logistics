import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, workLogsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function todayNPT(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
}

router.post(
  "/work-log/submit",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const { tasks, summary, mood, date } = req.body ?? {};
    const logDate = date ?? todayNPT();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ error: "At least one task is required." });
      return;
    }
    const cleanTasks = tasks.map((t: unknown) => String(t).trim()).filter(Boolean);
    if (cleanTasks.length === 0) {
      res.status(400).json({ error: "Tasks cannot be empty." });
      return;
    }

    const existing = await db
      .select({ id: workLogsTable.id })
      .from(workLogsTable)
      .where(and(eq(workLogsTable.userId, userId), eq(workLogsTable.date, logDate)))
      .limit(1);

    let row;
    if (existing[0]) {
      [row] = await db
        .update(workLogsTable)
        .set({ tasks: cleanTasks, summary: summary ?? null, mood: mood ?? null, updatedAt: new Date() })
        .where(eq(workLogsTable.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(workLogsTable)
        .values({ userId, date: logDate, tasks: cleanTasks, summary: summary ?? null, mood: mood ?? null })
        .returning();
    }

    req.log.info({ userId, date: logDate, taskCount: cleanTasks.length }, "work-log-submitted");
    res.status(existing[0] ? 200 : 201).json(row);
  }
);

router.get(
  "/work-log/today",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const today = todayNPT();
    const rows = await db
      .select()
      .from(workLogsTable)
      .where(and(eq(workLogsTable.userId, userId), eq(workLogsTable.date, today)))
      .limit(1);
    res.json(rows[0] ?? null);
  }
);

router.get(
  "/work-log/my",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const rows = await db
      .select()
      .from(workLogsTable)
      .where(eq(workLogsTable.userId, userId))
      .orderBy(desc(workLogsTable.date))
      .limit(30);
    res.json(rows);
  }
);

router.get(
  "/work-log/all",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const date = (req.query["date"] as string) ?? todayNPT();
    const rows = await db
      .select({
        id: workLogsTable.id,
        userId: workLogsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        date: workLogsTable.date,
        tasks: workLogsTable.tasks,
        summary: workLogsTable.summary,
        mood: workLogsTable.mood,
        updatedAt: workLogsTable.updatedAt,
        createdAt: workLogsTable.createdAt,
      })
      .from(workLogsTable)
      .innerJoin(usersTable, eq(usersTable.id, workLogsTable.userId))
      .where(eq(workLogsTable.date, date))
      .orderBy(usersTable.name);
    res.json(rows);
  }
);

export default router;
