import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, inquiriesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function isSafeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeImages(raw: unknown): string | null {
  if (raw == null) return null;
  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const safe = parsed.filter(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).name === "string" &&
      typeof (item as Record<string, unknown>).dataUrl === "string" &&
      /^data:image\/(png|jpe?g|gif|webp|bmp);base64,/.test(
        (item as Record<string, unknown>).dataUrl as string,
      ),
  );
  return safe.length > 0 ? JSON.stringify(safe) : null;
}

// Public — anyone can submit an inquiry
router.post("/inquiries", async (req, res): Promise<void> => {
  const { name, email, phone, productDetails, images, productLink, quantity, estimatedCost } = req.body;
  if (!name || !email || !productDetails) {
    res.status(400).json({ error: "name, email, and productDetails are required" });
    return;
  }

  const safeProductLink = productLink ? String(productLink).trim() : null;
  if (safeProductLink && !isSafeUrl(safeProductLink)) {
    res.status(400).json({ error: "productLink must be a valid http or https URL" });
    return;
  }

  const [row] = await db
    .insert(inquiriesTable)
    .values({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      productDetails: String(productDetails).trim(),
      images: sanitizeImages(images),
      productLink: safeProductLink,
      quantity: quantity != null ? String(quantity) : null,
      estimatedCost: estimatedCost != null ? String(estimatedCost) : null,
    })
    .returning();

  res.status(201).json(serialize(row));
});

// Admin/staff — list all inquiries
router.get("/inquiries", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  const rows = await db.select().from(inquiriesTable).orderBy(desc(inquiriesTable.createdAt));
  res.json(rows.map(serialize));
});

// Admin/staff — update status / notes
router.patch("/inquiries/:id", requireAuth("admin", "staff"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates: Record<string, unknown> = {};
  if (req.body.status != null) updates.status = String(req.body.status);
  if (req.body.adminNotes != null) updates.adminNotes = String(req.body.adminNotes);

  const [row] = await db
    .update(inquiriesTable)
    .set(updates)
    .where(eq(inquiriesTable.id, id))
    .returning();

  if (!row) { res.status(404).json({ error: "Inquiry not found" }); return; }
  res.json(serialize(row));
});

function serialize(row: typeof inquiriesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    productDetails: row.productDetails,
    images: row.images ?? null,
    productLink: row.productLink ?? null,
    quantity: row.quantity != null ? Number(row.quantity) : null,
    estimatedCost: row.estimatedCost != null ? Number(row.estimatedCost) : null,
    status: row.status,
    adminNotes: row.adminNotes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
