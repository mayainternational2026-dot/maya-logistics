import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  permissionsTable,
  shipmentsTable,
} from "@workspace/db";

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const trackId = () => `MIE${nano()}`;

async function ensureUser(opts: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "staff" | "customer";
  perms?: {
    canManageShipments: boolean;
    canManageCustomers: boolean;
    canGenerateInvoice: boolean;
  };
}): Promise<number> {
  const email = opts.email.toLowerCase();
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing) return existing.id;

  const passwordHash = await bcrypt.hash(opts.password, 10);
  const [u] = await db
    .insert(usersTable)
    .values({
      name: opts.name,
      email,
      phone: opts.phone,
      passwordHash,
      role: opts.role,
    })
    .returning();

  await db.insert(permissionsTable).values({
    userId: u.id,
    canManageShipments: opts.perms?.canManageShipments ?? false,
    canManageCustomers: opts.perms?.canManageCustomers ?? false,
    canGenerateInvoice: opts.perms?.canGenerateInvoice ?? false,
  });

  return u.id;
}

async function main() {
  const adminId = await ensureUser({
    name: "Maya Admin",
    email: "greenhouse2053@gmail.com",
    phone: "9768595133",
    password: "Sirish@@2054",
    role: "admin",
  });

  const staffAId = await ensureUser({
    name: "Sangita Shrestha",
    email: "sangita@maya.com",
    phone: "9801111111",
    password: "staff123",
    role: "staff",
    perms: {
      canManageShipments: true,
      canManageCustomers: true,
      canGenerateInvoice: true,
    },
  });

  const staffBId = await ensureUser({
    name: "Bikash Lama",
    email: "bikash@maya.com",
    phone: "9802222222",
    password: "staff123",
    role: "staff",
    perms: {
      canManageShipments: true,
      canManageCustomers: false,
      canGenerateInvoice: true,
    },
  });

  const customer1 = await ensureUser({
    name: "Aarati Karki",
    email: "aarati@example.com",
    phone: "9803333333",
    password: "customer123",
    role: "customer",
  });

  const customer2 = await ensureUser({
    name: "Rohan Tamang",
    email: "rohan@example.com",
    phone: "9804444444",
    password: "customer123",
    role: "customer",
  });

  const customer3 = await ensureUser({
    name: "Pemba Gurung",
    email: "pemba@example.com",
    phone: "9805555555",
    password: "customer123",
    role: "customer",
  });

  const existingShipments = await db.select({ id: shipmentsTable.id }).from(shipmentsTable);
  if (existingShipments.length > 0) {
    console.log(`Already have ${existingShipments.length} shipments — skipping shipment seed.`);
    await pool.end();
    return;
  }

  type Seed = {
    sender: string;
    senderPhone: string;
    receiver: string;
    receiverPhone: string;
    origin: string;
    destination: string;
    weight: number;
    cost: number;
    status: "pending" | "in_transit" | "delivered";
    customerId: number;
    createdById: number;
    daysAgo: number;
    notes?: string;
  };

  const seeds: Seed[] = [
    {
      sender: "Himalayan Handicrafts Pvt. Ltd.",
      senderPhone: "9851000111",
      receiver: "Mountain Imports LLC",
      receiverPhone: "+1 415 555 1042",
      origin: "Kathmandu, Nepal",
      destination: "San Francisco, USA",
      weight: 145.5,
      cost: 245000,
      status: "delivered",
      customerId: customer1,
      createdById: staffAId,
      daysAgo: 38,
      notes: "Pashmina shawls, hand-knotted carpets — fragile, keep dry.",
    },
    {
      sender: "Annapurna Tea Estate",
      senderPhone: "9851000222",
      receiver: "Berlin Specialty Imports GmbH",
      receiverPhone: "+49 30 555 0188",
      origin: "Kathmandu, Nepal",
      destination: "Berlin, Germany",
      weight: 320,
      cost: 412000,
      status: "in_transit",
      customerId: customer2,
      createdById: staffAId,
      daysAgo: 6,
      notes: "Single-estate orthodox tea, 64 cartons.",
    },
    {
      sender: "Sherpa Coffee Cooperative",
      senderPhone: "9851000333",
      receiver: "Tokyo Roasters Co.",
      receiverPhone: "+81 3 5555 0144",
      origin: "Kathmandu, Nepal",
      destination: "Tokyo, Japan",
      weight: 480,
      cost: 538000,
      status: "in_transit",
      customerId: customer3,
      createdById: staffBId,
      daysAgo: 11,
    },
    {
      sender: "Kathmandu Pashmina House",
      senderPhone: "9851000444",
      receiver: "Maison Lyon",
      receiverPhone: "+33 4 7255 0167",
      origin: "Kathmandu, Nepal",
      destination: "Lyon, France",
      weight: 28.4,
      cost: 96500,
      status: "pending",
      customerId: customer1,
      createdById: adminId,
      daysAgo: 1,
      notes: "Air freight — priority.",
    },
    {
      sender: "Newa Spice Traders",
      senderPhone: "9851000555",
      receiver: "Spice Bazaar London",
      receiverPhone: "+44 20 7555 0173",
      origin: "Kathmandu, Nepal",
      destination: "London, UK",
      weight: 210,
      cost: 287400,
      status: "delivered",
      customerId: customer2,
      createdById: staffAId,
      daysAgo: 75,
    },
    {
      sender: "Patan Metalcraft",
      senderPhone: "9851000666",
      receiver: "Brooklyn Heritage Goods",
      receiverPhone: "+1 718 555 0199",
      origin: "Kathmandu, Nepal",
      destination: "New York, USA",
      weight: 185,
      cost: 318000,
      status: "delivered",
      customerId: customer3,
      createdById: staffBId,
      daysAgo: 120,
    },
    {
      sender: "Lumbini Organic Farms",
      senderPhone: "9851000777",
      receiver: "Sydney Naturals",
      receiverPhone: "+61 2 5555 0214",
      origin: "Kathmandu, Nepal",
      destination: "Sydney, Australia",
      weight: 612,
      cost: 745000,
      status: "in_transit",
      customerId: customer1,
      createdById: staffAId,
      daysAgo: 18,
    },
    {
      sender: "Maya Import Export",
      senderPhone: "9769686908",
      receiver: "Dubai Logistics Hub",
      receiverPhone: "+971 4 555 0240",
      origin: "Kathmandu, Nepal",
      destination: "Dubai, UAE",
      weight: 1250,
      cost: 1180000,
      status: "delivered",
      customerId: customer2,
      createdById: adminId,
      daysAgo: 200,
      notes: "Container freight, sea route via Kolkata.",
    },
    {
      sender: "Boudha Statue Workshop",
      senderPhone: "9851000888",
      receiver: "Kyoto Sacred Arts",
      receiverPhone: "+81 75 555 0288",
      origin: "Kathmandu, Nepal",
      destination: "Kyoto, Japan",
      weight: 92,
      cost: 224000,
      status: "pending",
      customerId: customer3,
      createdById: staffAId,
      daysAgo: 0,
      notes: "Bronze statues, custom crating required.",
    },
    {
      sender: "Mustang Apple Cooperative",
      senderPhone: "9851000999",
      receiver: "Mumbai Fresh Imports",
      receiverPhone: "+91 22 5555 0319",
      origin: "Kathmandu, Nepal",
      destination: "Mumbai, India",
      weight: 4200,
      cost: 685000,
      status: "delivered",
      customerId: customer1,
      createdById: staffBId,
      daysAgo: 45,
    },
    {
      sender: "Thamel Trading House",
      senderPhone: "9851001010",
      receiver: "Toronto Heritage Imports",
      receiverPhone: "+1 416 555 0344",
      origin: "Kathmandu, Nepal",
      destination: "Toronto, Canada",
      weight: 78,
      cost: 162000,
      status: "in_transit",
      customerId: customer2,
      createdById: staffAId,
      daysAgo: 4,
    },
    {
      sender: "Kathmandu Honey Farms",
      senderPhone: "9851001111",
      receiver: "Seoul Organic Market",
      receiverPhone: "+82 2 5555 0376",
      origin: "Kathmandu, Nepal",
      destination: "Seoul, South Korea",
      weight: 360,
      cost: 398000,
      status: "delivered",
      customerId: customer3,
      createdById: adminId,
      daysAgo: 90,
    },
  ];

  for (const s of seeds) {
    const created = new Date();
    created.setDate(created.getDate() - s.daysAgo);
    await db.insert(shipmentsTable).values({
      trackingId: trackId(),
      senderName: s.sender,
      senderPhone: s.senderPhone,
      receiverName: s.receiver,
      receiverPhone: s.receiverPhone,
      origin: s.origin,
      destination: s.destination,
      weight: String(s.weight),
      cost: String(s.cost),
      status: s.status,
      notes: s.notes ?? null,
      customerId: s.customerId,
      createdById: s.createdById,
      createdAt: created,
      updatedAt: created,
    });
  }

  console.log(`Seeded ${seeds.length} shipments.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
