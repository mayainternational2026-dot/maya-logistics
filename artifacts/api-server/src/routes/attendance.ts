import { Router, type IRouter } from "express";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db, attendanceTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const NEPAL_TZ = "Asia/Kathmandu";
const LATE_HOUR = 9;       // Late if clock-in after 9:30 AM NPT
const LATE_MINUTE = 30;
const EARLY_OUT_HOUR = 17; // Early leave if clock-out before 5:30 PM NPT
const EARLY_OUT_MINUTE = 30;

function getNepalDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: NEPAL_TZ });
}

function getNepalTime(d: Date): { hours: number; minutes: number } {
  const str = d.toLocaleTimeString("en-US", {
    timeZone: NEPAL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = str.split(":").map(Number);
  return { hours: h, minutes: m };
}

function isLateArrival(clockIn: Date): boolean {
  const { hours, minutes } = getNepalTime(clockIn);
  return hours > LATE_HOUR || (hours === LATE_HOUR && minutes > LATE_MINUTE);
}

function isEarlyLeave(clockOut: Date): boolean {
  const { hours, minutes } = getNepalTime(clockOut);
  return hours < EARLY_OUT_HOUR || (hours === EARLY_OUT_HOUR && minutes < EARLY_OUT_MINUTE);
}

function isTooEarlyToClockIn(now: Date): boolean {
  const { hours, minutes } = getNepalTime(now);
  return hours < LATE_HOUR || (hours === LATE_HOUR && minutes < LATE_MINUTE);
}

function isTooLateToClockIn(now: Date): boolean {
  const { hours, minutes } = getNepalTime(now);
  return hours > EARLY_OUT_HOUR || (hours === EARLY_OUT_HOUR && minutes >= EARLY_OUT_MINUTE);
}

function calcMinutes(clockIn: Date, clockOut: Date): number {
  return Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

router.get(
  "/attendance/today",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const today = getNepalDate();
    const rows = await db
      .select()
      .from(attendanceTable)
      .where(
        and(eq(attendanceTable.userId, userId), eq(attendanceTable.date, today))
      )
      .limit(1);
    res.json(rows[0] ?? null);
  }
);

router.post(
  "/attendance/clock-in",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const now = new Date();
    const today = getNepalDate(now);

    // Server-side office hours check: clock-in only allowed 9:30 AM – 5:30 PM NPT
    if (isTooEarlyToClockIn(now)) {
      res.status(400).json({ error: "Office hasn't started yet. Clock-in is available from 9:30 AM NPT." });
      return;
    }
    if (isTooLateToClockIn(now)) {
      res.status(400).json({ error: "Office is closed for today. Clock-in is available 9:30 AM – 5:30 PM NPT." });
      return;
    }

    const existing = await db
      .select()
      .from(attendanceTable)
      .where(
        and(eq(attendanceTable.userId, userId), eq(attendanceTable.date, today))
      )
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Already clocked in today" });
      return;
    }

    const { lat, lng } = req.body ?? {};
    const late = isLateArrival(now);
    const { hours, minutes } = getNepalTime(now);

    const [row] = await db
      .insert(attendanceTable)
      .values({
        userId,
        date: today,
        clockIn: now,
        clockInLat: lat ? String(lat) : null,
        clockInLng: lng ? String(lng) : null,
        isLate: late,
      })
      .returning();

    req.log.info({ userId, date: today, late }, "clock-in");
    res.status(201).json({
      ...row,
      late,
      lateMessage: late
        ? `You arrived late at ${hours}:${String(minutes).padStart(2, "0")} NPT. Office starts at 9:30 AM. Please come on time.`
        : null,
    });
  }
);

router.post(
  "/attendance/clock-out",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const today = getNepalDate();

    const existing = await db
      .select()
      .from(attendanceTable)
      .where(
        and(eq(attendanceTable.userId, userId), eq(attendanceTable.date, today))
      )
      .limit(1);

    const record = existing[0];
    if (!record) {
      res.status(404).json({ error: "You have not clocked in today. Please clock in first." });
      return;
    }
    if (record.clockOut) {
      res.status(409).json({ error: "Already clocked out today" });
      return;
    }

    const now = new Date();
    const { lat, lng } = req.body ?? {};
    const minutes = calcMinutes(record.clockIn, now);
    const earlyLeave = isEarlyLeave(now);
    const { hours, mins: outMins } = (() => {
      const t = getNepalTime(now);
      return { hours: t.hours, mins: t.minutes };
    })();

    const [updated] = await db
      .update(attendanceTable)
      .set({
        clockOut: now,
        clockOutLat: lat ? String(lat) : null,
        clockOutLng: lng ? String(lng) : null,
        totalMinutes: minutes,
      })
      .where(eq(attendanceTable.id, record.id))
      .returning();

    req.log.info({ userId, minutes, earlyLeave }, "clock-out");
    res.json({
      ...updated,
      duration: formatDuration(minutes),
      earlyLeave,
      earlyLeaveMessage: earlyLeave
        ? `You left early at ${hours}:${String(outMins).padStart(2, "0")} NPT. Office ends at 5:30 PM. Please stay until end of office hours.`
        : null,
    });
  }
);

router.get(
  "/attendance/my-records",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const userId = req.currentUser!.id;
    const { month } = req.query as { month?: string };

    const conditions: ReturnType<typeof eq>[] = [eq(attendanceTable.userId, userId)];

    if (month) {
      conditions.push(
        gte(attendanceTable.date, `${month}-01`),
        lte(attendanceTable.date, `${month}-31`)
      );
    }

    const rows = await db
      .select()
      .from(attendanceTable)
      .where(and(...conditions))
      .orderBy(desc(attendanceTable.date))
      .limit(60);

    res.json(rows);
  }
);

router.get(
  "/attendance/all",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const { month, userId: qUserId, date } = req.query as {
      month?: string;
      userId?: string;
      date?: string;
    };

    const conditions: ReturnType<typeof eq>[] = [];

    if (qUserId) {
      conditions.push(eq(attendanceTable.userId, Number(qUserId)));
    }
    if (date) {
      conditions.push(eq(attendanceTable.date, date));
    } else if (month) {
      conditions.push(
        gte(attendanceTable.date, `${month}-01`),
        lte(attendanceTable.date, `${month}-31`)
      );
    }

    const rows = await db
      .select({
        id: attendanceTable.id,
        userId: attendanceTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        date: attendanceTable.date,
        clockIn: attendanceTable.clockIn,
        clockOut: attendanceTable.clockOut,
        isLate: attendanceTable.isLate,
        totalMinutes: attendanceTable.totalMinutes,
        clockInLat: attendanceTable.clockInLat,
        clockInLng: attendanceTable.clockInLng,
      })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(usersTable.id, attendanceTable.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendanceTable.date), usersTable.name)
      .limit(500);

    res.json(rows);
  }
);

router.get(
  "/attendance/summary",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const { month } = req.query as { month?: string };
    const m = month ?? getNepalDate().slice(0, 7);

    const rows = await db
      .select({
        userId: attendanceTable.userId,
        userName: usersTable.name,
        totalDays: sql<number>`count(*)::int`,
        lateDays: sql<number>`sum(case when ${attendanceTable.isLate} then 1 else 0 end)::int`,
        totalMinutes: sql<number>`sum(${attendanceTable.totalMinutes})::int`,
      })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(usersTable.id, attendanceTable.userId))
      .where(
        and(
          gte(attendanceTable.date, `${m}-01`),
          lte(attendanceTable.date, `${m}-31`)
        )
      )
      .groupBy(attendanceTable.userId, usersTable.name)
      .orderBy(usersTable.name);

    res.json(rows);
  }
);

router.get(
  "/attendance/export",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const { month } = req.query as { month?: string };
    const m = month ?? getNepalDate().slice(0, 7);

    const rows = await db
      .select({
        userName: usersTable.name,
        userEmail: usersTable.email,
        date: attendanceTable.date,
        clockIn: attendanceTable.clockIn,
        clockOut: attendanceTable.clockOut,
        isLate: attendanceTable.isLate,
        totalMinutes: attendanceTable.totalMinutes,
      })
      .from(attendanceTable)
      .innerJoin(usersTable, eq(usersTable.id, attendanceTable.userId))
      .where(
        and(
          gte(attendanceTable.date, `${m}-01`),
          lte(attendanceTable.date, `${m}-31`)
        )
      )
      .orderBy(attendanceTable.date, usersTable.name);

    const toNPT = (d: Date | null) =>
      d ? d.toLocaleString("en-US", { timeZone: NEPAL_TZ, hour12: true }) : "";

    const header = "Name,Email,Date,Clock In (NPT),Clock Out (NPT),Late,Hours Worked\r\n";
    const lines = rows.map((r) => {
      const hrs = r.totalMinutes ? (r.totalMinutes / 60).toFixed(2) : "";
      return [
        `"${r.userName}"`,
        `"${r.userEmail}"`,
        r.date,
        `"${toNPT(r.clockIn)}"`,
        `"${toNPT(r.clockOut)}"`,
        r.isLate ? "Yes" : "No",
        hrs,
      ].join(",");
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance-${m}.csv"`
    );
    res.send(header + lines.join("\r\n"));
  }
);

export default router;
