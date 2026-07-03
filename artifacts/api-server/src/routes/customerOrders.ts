import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, customerOrdersTable, usersTable } from "@workspace/db";
import { CreateCustomerOrderBody, DeleteCustomerOrderParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function canManage(user: { role: string; permissions: { canManageCustomers: boolean } }) {
  return user.role === "admin" || user.permissions.canManageCustomers;
}

function formatRow(
  r: typeof customerOrdersTable.$inferSelect & { createdByName?: string | null },
) {
  const totalPrice = Number(r.totalPrice);
  const paidAmount = Number(r.paidAmount);
  return {
    id: r.id,
    name: r.name,
    whatsappNumber: r.whatsappNumber ?? null,
    email: r.email ?? null,
    productName: r.productName,
    quantity: r.quantity,
    totalPrice,
    paidAmount,
    dueAmount: Math.max(0, totalPrice - paidAmount),
    createdById: r.createdById,
    createdByName: r.createdByName ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/customer-orders", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  const user = req.currentUser!;
  if (!canManage(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const rows = await db
      .select({
        id: customerOrdersTable.id,
        name: customerOrdersTable.name,
        whatsappNumber: customerOrdersTable.whatsappNumber,
        email: customerOrdersTable.email,
        productName: customerOrdersTable.productName,
        quantity: customerOrdersTable.quantity,
        totalPrice: customerOrdersTable.totalPrice,
        paidAmount: customerOrdersTable.paidAmount,
        createdById: customerOrdersTable.createdById,
        createdByName: usersTable.name,
        createdAt: customerOrdersTable.createdAt,
        updatedAt: customerOrdersTable.updatedAt,
      })
      .from(customerOrdersTable)
      .leftJoin(usersTable, eq(customerOrdersTable.createdById, usersTable.id))
      .orderBy(desc(customerOrdersTable.createdAt));

    res.json(rows.map(formatRow));
  } catch (err) {
    req.log.error({ err }, "Failed to list customer orders");
    res.status(500).json({ error: "Failed to fetch customer orders" });
  }
});

router.post("/customer-orders", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  const user = req.currentUser!;
  if (!canManage(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateCustomerOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, whatsappNumber, email, productName, quantity, totalPrice, paidAmount } =
    parsed.data;

  if (paidAmount != null && paidAmount > totalPrice) {
    res.status(400).json({ error: "Paid amount cannot exceed total price" });
    return;
  }

  try {
    const [row] = await db
      .insert(customerOrdersTable)
      .values({
        name: name.trim(),
        whatsappNumber: whatsappNumber?.trim() || null,
        email: email?.trim() || null,
        productName: productName.trim(),
        quantity: quantity ?? 1,
        totalPrice: String(totalPrice),
        paidAmount: String(paidAmount ?? 0),
        createdById: user.id,
      })
      .returning();

    res.status(201).json(formatRow({ ...row, createdByName: user.name }));
  } catch (err) {
    req.log.error({ err }, "Failed to create customer order");
    res.status(500).json({ error: "Failed to create customer order" });
  }
});

router.delete(
  "/customer-orders/:id",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const user = req.currentUser!;
    if (!canManage(user)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const params = DeleteCustomerOrderParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    try {
      const [existing] = await db
        .select()
        .from(customerOrdersTable)
        .where(eq(customerOrdersTable.id, params.data.id));
      if (!existing) {
        res.status(404).json({ error: "Customer order not found" });
        return;
      }

      await db.delete(customerOrdersTable).where(eq(customerOrdersTable.id, params.data.id));
      res.json({ message: "Customer order deleted" });
    } catch (err) {
      req.log.error({ err }, "Failed to delete customer order");
      res.status(500).json({ error: "Failed to delete customer order" });
    }
  },
);

export default router;
