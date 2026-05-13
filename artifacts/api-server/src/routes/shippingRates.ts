import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, shippingRatesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/shipping-rates", async (req, res): Promise<void> => {
  try {
    const rates = await db.select().from(shippingRatesTable).orderBy(shippingRatesTable.country);
    res.json(
      rates.map((r) => ({
        ...r,
        rateUsd: Number(r.rateUsd),
        rateNpr: Number(r.rateNpr),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list shipping rates");
    res.status(500).json({ error: "Failed to fetch shipping rates" });
  }
});

router.post("/shipping-rates", requireAuth("admin"), async (req, res): Promise<void> => {
  const { country, countryCode, rateUsd, rateNpr } = req.body;
  if (!country || !countryCode || rateUsd == null || rateNpr == null) {
    res.status(400).json({ error: "country, countryCode, rateUsd, and rateNpr are required" });
    return;
  }
  const usd = Number(rateUsd);
  const npr = Number(rateNpr);
  if (isNaN(usd) || usd < 0 || isNaN(npr) || npr < 0) {
    res.status(400).json({ error: "rates must be non-negative numbers" });
    return;
  }
  const [row] = await db
    .insert(shippingRatesTable)
    .values({
      country: String(country).trim(),
      countryCode: String(countryCode).trim().toUpperCase(),
      rateUsd: String(usd),
      rateNpr: String(npr),
    })
    .returning();
  res.status(201).json({ ...row, rateUsd: Number(row.rateUsd), rateNpr: Number(row.rateNpr) });
});

router.put("/shipping-rates/:id", requireAuth("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await db.select().from(shippingRatesTable).where(eq(shippingRatesTable.id, id));
  if (!existing.length) { res.status(404).json({ error: "Not found" }); return; }

  const { country, countryCode, rateUsd, rateNpr } = req.body;
  const updates: Partial<typeof shippingRatesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (country != null) updates.country = String(country).trim();
  if (countryCode != null) updates.countryCode = String(countryCode).trim().toUpperCase();
  if (rateUsd != null) {
    const v = Number(rateUsd);
    if (isNaN(v) || v < 0) { res.status(400).json({ error: "rateUsd must be non-negative" }); return; }
    updates.rateUsd = String(v);
  }
  if (rateNpr != null) {
    const v = Number(rateNpr);
    if (isNaN(v) || v < 0) { res.status(400).json({ error: "rateNpr must be non-negative" }); return; }
    updates.rateNpr = String(v);
  }

  const [row] = await db.update(shippingRatesTable).set(updates).where(eq(shippingRatesTable.id, id)).returning();
  res.json({ ...row, rateUsd: Number(row.rateUsd), rateNpr: Number(row.rateNpr) });
});

router.delete("/shipping-rates/:id", requireAuth("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await db.select().from(shippingRatesTable).where(eq(shippingRatesTable.id, id));
  if (!existing.length) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(shippingRatesTable).where(eq(shippingRatesTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
