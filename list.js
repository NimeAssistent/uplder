import { getSql, isAdmin } from "../lib/db.js";

// Khusus admin: header x-admin-token harus sama dengan env ADMIN_TOKEN
export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ error: "Khusus admin." });
  const limit = Math.min(Number(req.query.limit) || 50, 200), offset = Number(req.query.offset) || 0;
  const sql = await getSql();
  const rows = await sql`SELECT url, original_name, size, mime, ip, created_at FROM uploads ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
  res.status(200).json(rows);
}
