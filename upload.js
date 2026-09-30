import { handleUpload } from "@vercel/blob/client";
import { getSql, clientIp, TYPES, MAX_MB } from "../lib/db.js";

// Membuat token unggah. File dikirim langsung dari browser ke Vercel Blob,
// jadi tidak kena batas body 4,5 MB milik Vercel Functions.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan." });
  try {
    const ip = clientIp(req);
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        const sql = await getSql();
        const rows = await sql`SELECT count(*)::int AS n FROM uploads WHERE ip = ${ip} AND created_at > ${Date.now() - 600000}`;
        if (rows[0].n >= 30) throw new Error("Terlalu banyak unggahan. Coba lagi nanti.");
        return { allowedContentTypes: TYPES, maximumSizeInBytes: MAX_MB * 1024 * 1024, addRandomSuffix: true };
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
