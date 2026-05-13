import { db, shippingRatesTable } from "@workspace/db";

const initial = [
  { country: "India",  countryCode: "IN", rateUsd: "3.50",  rateNpr: "470"  },
  { country: "China",  countryCode: "CN", rateUsd: "5.00",  rateNpr: "665"  },
];

const existing = await db.select().from(shippingRatesTable);
if (existing.length > 0) {
  console.log("Shipping rates already seeded:", existing.map((r) => r.country).join(", "));
} else {
  await db.insert(shippingRatesTable).values(initial);
  console.log("Seeded:", initial.map((r) => r.country).join(", "));
}
process.exit(0);
