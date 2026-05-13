import { Router, type IRouter } from "express";
import { desc, eq, and } from "drizzle-orm";
import { db, expensesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function sanitizePhoto(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  if (/^data:image\/(png|jpe?g|gif|webp|bmp);base64,/.test(s)) return s;
  return null;
}

function formatRow(
  r: typeof expensesTable.$inferSelect & { createdByName?: string | null },
) {
  return {
    id: r.id,
    date: r.date,
    productName: r.productName,
    price: Number(r.price),
    quantity: r.quantity,
    total: Number(r.price) * r.quantity,
    photoUrl: r.photoUrl ?? null,
    notes: r.notes ?? null,
    createdBy: r.createdBy,
    createdByName: r.createdByName ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// GET /expenses — admin: all, staff: own
router.get("/expenses", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  try {
    const user = req.currentUser!;
    const isAdmin = user.role === "admin";

    const rows = await db
      .select({
        id: expensesTable.id,
        date: expensesTable.date,
        productName: expensesTable.productName,
        price: expensesTable.price,
        quantity: expensesTable.quantity,
        photoUrl: expensesTable.photoUrl,
        notes: expensesTable.notes,
        createdBy: expensesTable.createdBy,
        createdByName: usersTable.name,
        createdAt: expensesTable.createdAt,
        updatedAt: expensesTable.updatedAt,
      })
      .from(expensesTable)
      .leftJoin(usersTable, eq(expensesTable.createdBy, usersTable.id))
      .where(isAdmin ? undefined : eq(expensesTable.createdBy, user.id))
      .orderBy(desc(expensesTable.date), desc(expensesTable.createdAt));

    res.json(rows.map(formatRow));
  } catch (err) {
    req.log.error({ err }, "Failed to list expenses");
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// POST /expenses — staff or admin adds
router.post("/expenses", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  try {
    const user = req.currentUser!;
    const { date, productName, price, quantity, photoUrl, notes } = req.body;

    if (!date || !productName || price == null || quantity == null) {
      res.status(400).json({ error: "date, productName, price, and quantity are required" });
      return;
    }

    const priceNum = Number(price);
    const qtyNum = Number(quantity);
    if (isNaN(priceNum) || priceNum < 0) {
      res.status(400).json({ error: "price must be a non-negative number" });
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 1 || !Number.isInteger(qtyNum)) {
      res.status(400).json({ error: "quantity must be a positive integer" });
      return;
    }

    const [row] = await db
      .insert(expensesTable)
      .values({
        date: String(date),
        productName: String(productName).trim(),
        price: String(priceNum),
        quantity: qtyNum,
        photoUrl: sanitizePhoto(photoUrl),
        notes: notes ? String(notes).trim() : null,
        createdBy: user.id,
      })
      .returning();

    res.status(201).json(formatRow({ ...row, createdByName: user.name }));
  } catch (err) {
    req.log.error({ err }, "Failed to create expense");
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// PUT /expenses/:id — admin: any, staff: own
router.put("/expenses/:id", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  try {
    const user = req.currentUser!;
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Expense not found" }); return; }

    if (user.role !== "admin" && existing.createdBy !== user.id) {
      res.status(403).json({ error: "You can only edit your own expenses" });
      return;
    }

    const { date, productName, price, quantity, photoUrl, notes } = req.body;
    const updates: Partial<typeof expensesTable.$inferInsert> = { updatedAt: new Date() };

    if (date != null) updates.date = String(date);
    if (productName != null) updates.productName = String(productName).trim();
    if (price != null) {
      const v = Number(price);
      if (isNaN(v) || v < 0) { res.status(400).json({ error: "price must be non-negative" }); return; }
      updates.price = String(v);
    }
    if (quantity != null) {
      const v = Number(quantity);
      if (isNaN(v) || v < 1 || !Number.isInteger(v)) { res.status(400).json({ error: "quantity must be a positive integer" }); return; }
      updates.quantity = v;
    }
    if ("photoUrl" in req.body) updates.photoUrl = sanitizePhoto(req.body.photoUrl);
    if ("notes" in req.body) updates.notes = notes ? String(notes).trim() : null;

    const [row] = await db
      .update(expensesTable)
      .set(updates)
      .where(eq(expensesTable.id, id))
      .returning();

    const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, row.createdBy));
    res.json(formatRow({ ...row, createdByName: author?.name ?? null }));
  } catch (err) {
    req.log.error({ err }, "Failed to update expense");
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE /expenses/:id — admin: any, staff: own
router.delete("/expenses/:id", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  try {
    const user = req.currentUser!;
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Expense not found" }); return; }

    if (user.role !== "admin" && existing.createdBy !== user.id) {
      res.status(403).json({ error: "You can only delete your own expenses" });
      return;
    }

    await db.delete(expensesTable).where(eq(expensesTable.id, id));
    res.json({ message: "Expense deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete expense");
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
