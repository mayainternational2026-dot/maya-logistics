import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, productSourcingTable, usersTable } from "@workspace/db";
import { CreateProductSourcingBody, DeleteProductSourcingParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function formatRow(
  r: typeof productSourcingTable.$inferSelect & { createdByName?: string | null },
) {
  const shippingCost = Number(r.shippingCost);
  const customsCost = Number(r.customsCost);
  const serviceCharge = Number(r.serviceCharge);
  return {
    id: r.id,
    sourceProduct: r.sourceProduct,
    productName: r.productName,
    quantity: r.quantity,
    shippingCost,
    customsCost,
    serviceCharge,
    totalCost: shippingCost + customsCost + serviceCharge,
    productImagePath: r.productImagePath ?? null,
    productVideoPath: r.productVideoPath ?? null,
    createdById: r.createdById,
    createdByName: r.createdByName ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get(
  "/product-sourcing",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    try {
      const rows = await db
        .select({
          id: productSourcingTable.id,
          sourceProduct: productSourcingTable.sourceProduct,
          productName: productSourcingTable.productName,
          quantity: productSourcingTable.quantity,
          shippingCost: productSourcingTable.shippingCost,
          customsCost: productSourcingTable.customsCost,
          serviceCharge: productSourcingTable.serviceCharge,
          productImagePath: productSourcingTable.productImagePath,
          productVideoPath: productSourcingTable.productVideoPath,
          createdById: productSourcingTable.createdById,
          createdByName: usersTable.name,
          createdAt: productSourcingTable.createdAt,
          updatedAt: productSourcingTable.updatedAt,
        })
        .from(productSourcingTable)
        .leftJoin(usersTable, eq(productSourcingTable.createdById, usersTable.id))
        .orderBy(desc(productSourcingTable.createdAt));

      res.json(rows.map(formatRow));
    } catch (err) {
      req.log.error({ err }, "Failed to list product sourcing records");
      res.status(500).json({ error: "Failed to fetch product sourcing records" });
    }
  },
);

router.post(
  "/product-sourcing",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const user = req.currentUser!;

    const parsed = CreateProductSourcingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const {
      sourceProduct,
      productName,
      quantity,
      shippingCost,
      customsCost,
      serviceCharge,
      productImagePath,
      productVideoPath,
    } = parsed.data;

    try {
      const [row] = await db
        .insert(productSourcingTable)
        .values({
          sourceProduct: sourceProduct.trim(),
          productName: productName.trim(),
          quantity: quantity ?? 1,
          shippingCost: String(shippingCost ?? 0),
          customsCost: String(customsCost ?? 0),
          serviceCharge: String(serviceCharge ?? 0),
          productImagePath: productImagePath?.trim() || null,
          productVideoPath: productVideoPath?.trim() || null,
          createdById: user.id,
        })
        .returning();

      res.status(201).json(formatRow({ ...row, createdByName: user.name }));
    } catch (err) {
      req.log.error({ err }, "Failed to create product sourcing record");
      res.status(500).json({ error: "Failed to create product sourcing record" });
    }
  },
);

router.delete(
  "/product-sourcing/:id",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const user = req.currentUser!;

    const params = DeleteProductSourcingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    try {
      const [existing] = await db
        .select()
        .from(productSourcingTable)
        .where(eq(productSourcingTable.id, params.data.id));
      if (!existing) {
        res.status(404).json({ error: "Product sourcing record not found" });
        return;
      }

      if (user.role !== "admin" && existing.createdById !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      await db.delete(productSourcingTable).where(eq(productSourcingTable.id, params.data.id));
      res.json({ message: "Product sourcing record deleted" });
    } catch (err) {
      req.log.error({ err }, "Failed to delete product sourcing record");
      res.status(500).json({ error: "Failed to delete product sourcing record" });
    }
  },
);

export default router;
