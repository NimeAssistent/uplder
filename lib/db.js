import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const sql = neon(process.env.DATABASE_URL);
let ready;

// Membuat tabel sekali per instance function, lalu mengembalikan koneksi
export async function getSql() {
  ready ||= sql`CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    pathname TEXT,
    original_name TEXT,
    size BIGINT,
    mime TEXT,
    ip TEXT,
    token_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
  )`;
  await ready;
  return sql;
}

export const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
export const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
export const isAdmin = (req) => !!process.env.ADMIN_TOKEN && req.headers["x-admin-token"] === process.env.ADMIN_TOKEN;
export const TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_MB = Number(process.env.MAX_MB || 20);
  
