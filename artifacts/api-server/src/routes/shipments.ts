import { Router, type IRouter } from "express";
import { eq, and, or, desc, ilike } from "drizzle-orm";
import { db, shipmentsTable } from "@workspace/db";
import {
  ListShipmentsQueryParams,
  CreateShipmentBody,
  GetShipmentParams,
  UpdateShipmentParams,
  UpdateShipmentBody,
  DeleteShipmentParams,
  TrackShipmentParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { generateTrackingId } from "../lib/tracking";
import { serializeShipment, serializeShipments, loadUserMeta } from "../lib/serialize";
import {
  sendStatusUpdateEmail,
  sendPaymentConfirmedEmail,
  type ShipmentStatus,
} from "../lib/mailer";

const router: IRouter = Router();

router.get(
  "/shipments",
  requireAuth(),
  async (req, res): Promise<void> => {
    const parsed = ListShipmentsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const conds = [];
    if (parsed.data.status) {
      conds.push(eq(shipmentsTable.status, parsed.data.status));
    }
    if (parsed.data.search) {
      const term = `%${parsed.data.search}%`;
      conds.push(
        or(
          ilike(shipmentsTable.trackingId, term),
          ilike(shipmentsTable.senderName, term),
          ilike(shipmentsTable.receiverName, term),
          ilike(shipmentsTable.origin, term),
          ilike(shipmentsTable.destination, term),
        )!,
      );
    }
    if (req.currentUser!.role === "customer") {
      conds.push(eq(shipmentsTable.customerId, req.currentUser!.id));
    }

    const where = conds.length > 0 ? and(...conds) : undefined;
    const rows = await db
      .select()
      .from(shipmentsTable)
      .where(where)
      .orderBy(desc(shipmentsTable.createdAt));

    res.json(await serializeShipments(rows));
  },
);

router.post(
  "/shipments",
  requireAuth(),
  async (req, res): Promise<void> => {
    const parsed = CreateShipmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const me = req.currentUser!;

    // Permission: any authenticated user can create. Customers can only book
    // for themselves; admin/staff (with shipment permission) can book on
    // behalf of any customer.
    let customerId: number | null = parsed.data.customerId ?? null;
    if (me.role === "customer") {
      customerId = me.id;
    } else if (me.role === "staff" && !me.permissions.canManageShipments) {
      res.status(403).json({ error: "You do not have permission to manage shipments" });
      return;
    }

    const trackingId = generateTrackingId();

    const [row] = await db
      .insert(shipmentsTable)
      .values({
        trackingId,
        shipmentType: parsed.data.shipmentType ?? "export",
        freightMode: parsed.data.freightMode ?? null,
        senderName: parsed.data.senderName.trim(),
        senderPhone: parsed.data.senderPhone?.trim() || null,
        receiverName: parsed.data.receiverName.trim(),
        receiverPhone: parsed.data.receiverPhone?.trim() || null,
        customerPhone: parsed.data.customerPhone?.trim() || null,
        origin: parsed.data.origin.trim(),
        destination: parsed.data.destination.trim(),
        productName: parsed.data.productName?.trim() || null,
        quantity: parsed.data.quantity ?? null,
        weight: String(parsed.data.weight),
        dimensions: parsed.data.dimensions?.trim() || null,
        cost: String(parsed.data.cost),
        paidAmount: parsed.data.paidAmount != null ? String(parsed.data.paidAmount) : null,
        estimatedDelivery: parsed.data.estimatedDelivery ? new Date(parsed.data.estimatedDelivery) : null,
        status: "pending",
        notes: parsed.data.notes?.trim() || null,
        customerId,
        createdById: me.id,
      })
      .returning();

    res.status(201).json(await serializeShipment(row));
  },
);

router.get(
  "/shipments/track/:trackingId",
  async (req, res): Promise<void> => {
    const params = TrackShipmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.trackingId, params.data.trackingId.toUpperCase()))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "No shipment found with that tracking ID" });
      return;
    }

    res.json({
      trackingId:        row.trackingId,
      senderName:        row.senderName,
      senderPhone:       row.senderPhone ?? null,
      receiverName:      row.receiverName,
      receiverPhone:     row.receiverPhone ?? null,
      origin:            row.origin,
      destination:       row.destination,
      weight:            Number(row.weight),
      freightMode:       row.freightMode ?? null,
      productName:       row.productName ?? null,
      quantity:          row.quantity ?? null,
      estimatedDelivery: row.estimatedDelivery ? row.estimatedDelivery.toISOString() : null,
      status:            row.status,
      createdAt:         row.createdAt.toISOString(),
      updatedAt:         row.updatedAt.toISOString(),
    });
  },
);

router.get(
  "/shipments/:id",
  requireAuth(),
  async (req, res): Promise<void> => {
    const params = GetShipmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, params.data.id))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    if (
      req.currentUser!.role === "customer" &&
      row.customerId !== req.currentUser!.id
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(await serializeShipment(row));
  },
);

router.patch(
  "/shipments/:id",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const me = req.currentUser!;
    if (me.role === "staff" && !me.permissions.canManageShipments) {
      res.status(403).json({ error: "You do not have permission to update shipments" });
      return;
    }

    const params = UpdateShipmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = UpdateShipmentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (body.data.shipmentType != null) updates.shipmentType = body.data.shipmentType;
    if (body.data.freightMode != null) updates.freightMode = body.data.freightMode;
    if (body.data.senderName != null) updates.senderName = body.data.senderName.trim();
    if (body.data.senderPhone != null) updates.senderPhone = body.data.senderPhone.trim() || null;
    if (body.data.receiverName != null) updates.receiverName = body.data.receiverName.trim();
    if (body.data.receiverPhone != null) updates.receiverPhone = body.data.receiverPhone.trim() || null;
    if (body.data.customerPhone != null) updates.customerPhone = body.data.customerPhone.trim() || null;
    if (body.data.origin != null) updates.origin = body.data.origin.trim();
    if (body.data.destination != null) updates.destination = body.data.destination.trim();
    if (body.data.productName != null) updates.productName = body.data.productName.trim() || null;
    if (body.data.quantity != null) updates.quantity = body.data.quantity;
    if (body.data.weight != null) updates.weight = String(body.data.weight);
    if (body.data.dimensions != null) updates.dimensions = body.data.dimensions.trim() || null;
    if (body.data.cost != null) updates.cost = String(body.data.cost);
    if (body.data.paidAmount != null) updates.paidAmount = String(body.data.paidAmount);
    if (body.data.estimatedDelivery != null) updates.estimatedDelivery = new Date(body.data.estimatedDelivery);
    if (body.data.status != null) updates.status = body.data.status;
    if (body.data.paid != null) {
      updates.paid = body.data.paid;
      updates.paidAt = body.data.paid ? new Date() : null;
    }
    if (body.data.notes != null) updates.notes = body.data.notes.trim() || null;

    // Fetch current row before update so we can detect changes
    const [existing] = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    const [row] = await db
      .update(shipmentsTable)
      .set(updates)
      .where(eq(shipmentsTable.id, params.data.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    res.json(await serializeShipment(row));

    // Send emails asynchronously — don't block the response
    if (row.customerId) {
      const customer = await loadUserMeta(row.customerId);
      if (customer?.email) {
        const shipmentData = {
          trackingId: row.trackingId,
          customerName: customer.name,
          customerEmail: customer.email,
          origin: row.origin,
          destination: row.destination,
          weight: Number(row.weight),
          cost: Number(row.cost),
        };

        // Payment confirmed
        if (body.data.paid === true && !existing.paid) {
          sendPaymentConfirmedEmail(shipmentData).catch((e) =>
            req.log.error({ err: e }, "Failed to send payment email"),
          );
        }

        // Status changed
        if (body.data.status && body.data.status !== existing.status) {
          sendStatusUpdateEmail(shipmentData, body.data.status as ShipmentStatus).catch(
            (e) => req.log.error({ err: e }, "Failed to send status email"),
          );
        }
      }
    }
  },
);

router.delete(
  "/shipments/:id",
  requireAuth("admin", "staff"),
  async (req, res): Promise<void> => {
    const me = req.currentUser!;
    if (me.role === "staff" && !me.permissions.canManageShipments) {
      res.status(403).json({ error: "You do not have permission to delete shipments" });
      return;
    }

    const params = DeleteShipmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    await db.delete(shipmentsTable).where(eq(shipmentsTable.id, params.data.id));
    res.status(204).end();
  },
);

export default router;
