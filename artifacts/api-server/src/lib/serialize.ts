import { eq } from "drizzle-orm";
import { db, shipmentsTable, usersTable } from "@workspace/db";

type ShipmentRow = typeof shipmentsTable.$inferSelect;

export interface SerializedShipment {
  id: number;
  trackingId: string;
  shipmentType: "import" | "export";
  senderName: string;
  senderPhone: string | null;
  receiverName: string;
  receiverPhone: string | null;
  origin: string;
  destination: string;
  productName: string | null;
  quantity: number | null;
  weight: number;
  dimensions: string | null;
  cost: number;
  status: "pending" | "collected" | "at_warehouse" | "customs_clearance" | "in_transit" | "arrived" | "delivered";
  paid: boolean;
  paidAt: string | null;
  notes: string | null;
  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function serializeShipments(
  rows: ShipmentRow[],
): Promise<SerializedShipment[]> {
  if (rows.length === 0) return [];

  const userIds = new Set<number>();
  for (const row of rows) {
    if (row.customerId != null) userIds.add(row.customerId);
    if (row.createdById != null) userIds.add(row.createdById);
  }

  const users = userIds.size
    ? await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        })
        .from(usersTable)
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((row) => {
    const customer = row.customerId != null ? userMap.get(row.customerId) : undefined;
    const creator = row.createdById != null ? userMap.get(row.createdById) : undefined;
    return {
      id: row.id,
      trackingId: row.trackingId,
      shipmentType: (row.shipmentType ?? "export") as "import" | "export",
      senderName: row.senderName,
      senderPhone: row.senderPhone ?? null,
      receiverName: row.receiverName,
      receiverPhone: row.receiverPhone ?? null,
      origin: row.origin,
      destination: row.destination,
      productName: row.productName ?? null,
      quantity: row.quantity ?? null,
      weight: Number(row.weight),
      dimensions: row.dimensions ?? null,
      cost: Number(row.cost),
      status: row.status as SerializedShipment["status"],
      paid: row.paid,
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      notes: row.notes ?? null,
      customerId: row.customerId,
      customerName: customer?.name ?? null,
      customerEmail: customer?.email ?? null,
      createdById: row.createdById,
      createdByName: creator?.name ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function serializeShipment(
  row: ShipmentRow,
): Promise<SerializedShipment> {
  const [s] = await serializeShipments([row]);
  return s;
}

export async function loadUserMeta(id: number) {
  const [u] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return u ?? null;
}
