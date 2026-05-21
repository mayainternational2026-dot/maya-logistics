import { pool } from "@workspace/db";

const client = await pool.connect();
try {
  await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(64)`);
  await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipment_type VARCHAR(16) NOT NULL DEFAULT 'export'`);
  await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_name TEXT`);
  await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS quantity INTEGER`);
  await client.query(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dimensions VARCHAR(64)`);
  console.log("Migration complete ✓");
} finally {
  client.release();
  await pool.end();
}
