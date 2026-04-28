import { Router, type IRouter } from "express";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { db, shipmentsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { serializeShipments } from "../lib/serialize";

const router: IRouter = Router();

router.get(
  "/dashboard/summary",
  requireAuth("admin", "staff"),
  async (_req, res): Promise<void> => {
    const [counts] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`sum(case when ${shipmentsTable.status} = 'pending' then 1 else 0 end)::int`,
        inTransit: sql<number>`sum(case when ${shipmentsTable.status} = 'in_transit' then 1 else 0 end)::int`,
        delivered: sql<number>`sum(case when ${shipmentsTable.status} = 'delivered' then 1 else 0 end)::int`,
        totalRevenue: sql<string>`coalesce(sum(${shipmentsTable.cost}), 0)`,
        deliveredRevenue: sql<string>`coalesce(sum(case when ${shipmentsTable.status} = 'delivered' then ${shipmentsTable.cost} else 0 end), 0)`,
        avgCost: sql<string>`coalesce(avg(${shipmentsTable.cost}), 0)`,
      })
      .from(shipmentsTable);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [thisMonth] = await db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${shipmentsTable.cost}), 0)`,
      })
      .from(shipmentsTable)
      .where(gte(shipmentsTable.createdAt, startOfMonth));

    const [userCounts] = await db
      .select({
        customers: sql<number>`sum(case when ${usersTable.role} = 'customer' then 1 else 0 end)::int`,
        staff: sql<number>`sum(case when ${usersTable.role} = 'staff' then 1 else 0 end)::int`,
      })
      .from(usersTable);

    res.json({
      totalShipments: counts?.total ?? 0,
      pending: counts?.pending ?? 0,
      inTransit: counts?.inTransit ?? 0,
      delivered: counts?.delivered ?? 0,
      totalRevenue: Number(counts?.totalRevenue ?? 0),
      deliveredRevenue: Number(counts?.deliveredRevenue ?? 0),
      totalCustomers: userCounts?.customers ?? 0,
      totalStaff: userCounts?.staff ?? 0,
      avgShipmentCost: Number(counts?.avgCost ?? 0),
      shipmentsThisMonth: thisMonth?.count ?? 0,
      revenueThisMonth: Number(thisMonth?.revenue ?? 0),
    });
  },
);

router.get(
  "/dashboard/recent-shipments",
  requireAuth("admin", "staff"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(shipmentsTable)
      .orderBy(desc(shipmentsTable.createdAt))
      .limit(8);
    res.json(await serializeShipments(rows));
  },
);

router.get(
  "/dashboard/revenue-trend",
  requireAuth("admin", "staff"),
  async (_req, res): Promise<void> => {
    // Last 12 months including current
    const rows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${shipmentsTable.createdAt}), 'YYYY-MM')`,
        shipments: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${shipmentsTable.cost}), 0)`,
      })
      .from(shipmentsTable)
      .groupBy(sql`date_trunc('month', ${shipmentsTable.createdAt})`)
      .orderBy(sql`date_trunc('month', ${shipmentsTable.createdAt})`);

    const map = new Map(
      rows.map((r) => [r.month, { shipments: r.shipments, revenue: Number(r.revenue) }]),
    );

    const out: { month: string; shipments: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(key);
      out.push({
        month: key,
        shipments: entry?.shipments ?? 0,
        revenue: entry?.revenue ?? 0,
      });
    }

    res.json(out);
  },
);

router.get(
  "/dashboard/staff-activity",
  requireAuth("admin"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        shipmentsCreated: sql<number>`count(${shipmentsTable.id})::int`,
        revenueGenerated: sql<string>`coalesce(sum(${shipmentsTable.cost}), 0)`,
      })
      .from(usersTable)
      .leftJoin(shipmentsTable, eq(shipmentsTable.createdById, usersTable.id))
      .groupBy(usersTable.id)
      .orderBy(desc(sql`count(${shipmentsTable.id})`));

    res.json(
      rows
        .filter((r) => r.role === "admin" || r.role === "staff")
        .map((r) => ({
          userId: r.userId,
          name: r.name,
          email: r.email,
          shipmentsCreated: r.shipmentsCreated,
          revenueGenerated: Number(r.revenueGenerated),
        })),
    );
  },
);

export default router;
void and;
