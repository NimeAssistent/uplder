import crypto from "node:crypto";
import { head } from "@vercel/blob";
import { getSql, sha, clientIp, TYPES } from "../lib/db.js";

// Dipanggil setelah unggah selesai: mencatat metadata dan membuat token hapus.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan." });
  try {
    const { url, name } = req.body || {};
    const u = new URL(url);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".public.blob.vercel-storage.com"))
      return res.status(400).json({ error: "URL tidak valid." });

    const info = await head(url); // memastikan file benar-benar ada
    if (!TYPES.includes(info.contentType)) return res.status(400).json({ error: "Tipe file tidak diizinkan." });

    const sql = await getSql();
    const token = crypto.randomBytes(16).toString("hex");
    const rows = await sql`INSERT INTO uploads (url, pathname, original_name, size, mime, ip, token_hash, created_at)
      VALUES (${url}, ${info.pathname}, ${String(name || "").slice(0, 200)}, ${info.size}, ${info.contentType}, ${clientIp(req)}, ${sha(token)}, ${Date.now()})
      ON CONFLICT (url) DO NOTHING RETURNING id`;
    if (!rows.length) return res.status(409).json({ error: "File sudah terdaftar." });
    res.status(200).json({ url, deleteToken: token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
