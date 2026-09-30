const express = require("express");
const multer = require("multer");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || "";       // contoh: https://img.domainanda.com
const MAX_MB = Number(process.env.MAX_MB || 20);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ""; // opsional: untuk melihat/menghapus semua unggahan
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(DIR, { recursive: true });

// Database SQLite: file data/data.db
const db = new Database(path.join(DATA_DIR, "data.db"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT,
  size INTEGER,
  mime TEXT,
  ip TEXT,
  token_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`);
const insert = db.prepare("INSERT INTO uploads (filename, original_name, size, mime, ip, token_hash, created_at) VALUES (?,?,?,?,?,?,?)");
const findOne = db.prepare("SELECT * FROM uploads WHERE filename = ?");
const removeRow = db.prepare("DELETE FROM uploads WHERE filename = ?");
const listAll = db.prepare("SELECT filename, original_name, size, mime, ip, created_at FROM uploads ORDER BY id DESC LIMIT ? OFFSET ?");

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp" };
const NAME_RE = /^[a-f0-9]{10}\.(jpg|png|gif|webp)$/;

const upload = multer({
  storage: multer.diskStorage({
    destination: DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(5).toString("hex") + EXT[file.mimetype]),
  }),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new Error("Format tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.")),
});

// Batas sederhana: 30 unggahan per 10 menit per IP
const hits = new Map();
function limiter(req, res, next) {
  const now = Date.now(), list = (hits.get(req.ip) || []).filter((t) => now - t < 600000);
  if (list.length >= 30) return res.status(429).json({ error: "Terlalu banyak unggahan. Coba lagi nanti." });
  list.push(now); hits.set(req.ip, list); next();
}

const isAdmin = (req) => ADMIN_TOKEN && req.get("x-admin-token") === ADMIN_TOKEN;

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/f", express.static(DIR, {
  maxAge: "365d", immutable: true, index: false, dotfiles: "deny",
  setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));

app.post("/upload", limiter, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file." });
  const token = crypto.randomBytes(16).toString("hex");
  insert.run(req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, req.ip, sha(token), Date.now());
  const base = BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.json({ url: `${base}/f/${req.file.filename}`, filename: req.file.filename, name: req.file.originalname, size: req.file.size, deleteToken: token });
});

// Hapus gambar: butuh deleteToken dari saat unggah (atau header x-admin-token)
app.post("/delete", (req, res) => {
  const { filename, token } = req.body || {};
  if (!NAME_RE.test(filename || "")) return res.status(400).json({ error: "Nama file tidak valid." });
  const row = findOne.get(filename);
  if (!row) return res.status(404).json({ error: "File tidak ditemukan." });
  if (!isAdmin(req) && sha(token) !== row.token_hash) return res.status(403).json({ error: "Token salah." });
  fs.unlink(path.join(DIR, filename), () => {});
  removeRow.run(filename);
  res.json({ ok: true });
});

// Daftar semua unggahan (khusus admin)
app.get("/api/uploads", (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "Khusus admin." });
  const limit = Math.min(Number(req.query.limit) || 50, 200), offset = Number(req.query.offset) || 0;
  res.json(listAll.all(limit, offset));
});

app.use((err, req, res, next) => {
  const msg = err.code === "LIMIT_FILE_SIZE" ? `File lebih dari ${MAX_MB} MB.` : err.message;
  res.status(400).json({ error: msg });
});

app.listen(PORT, () => console.log(`Berjalan di http://localhost:${PORT}`));
