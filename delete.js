import { del } from "@vercel/blob";
import { getSql, sha, isAdmin } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan." });
  try {
    const { url, token } = req.body || {};
    const sql = await getSql();
    const rows = await sql`SELECT token_hash FROM uploads WHERE url = ${String(url)}`;
    if (!rows.length) return res.status(404).json({ error: "File tidak ditemukan." });
    if (!isAdmin(req) && sha(token) !== rows[0].token_hash) return res.status(403).json({ error: "Token salah." });
    await del(url);
    await sql`DELETE FROM uploads WHERE url = ${url}`;
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
