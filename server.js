const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || ""; // contoh: https://img.domainanda.com
const MAX_MB = Number(process.env.MAX_MB || 20);
const DIR = path.join(__dirname, "uploads");
fs.mkdirSync(DIR, { recursive: true });

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp" };

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

const app = express();
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public")));
app.use("/f", express.static(DIR, {
  maxAge: "365d", immutable: true, index: false, dotfiles: "deny",
  setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));

app.post("/upload", limiter, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file." });
  const base = BASE_URL || `${req.protocol}://${req.get("host")}`;
  res.json({ url: `${base}/f/${req.file.filename}`, name: req.file.originalname, size: req.file.size });
});

app.use((err, req, res, next) => {
  const msg = err.code === "LIMIT_FILE_SIZE" ? `File lebih dari ${MAX_MB} MB.` : err.message;
  res.status(400).json({ error: msg });
});

app.listen(PORT, () => console.log(`Berjalan di http://localhost:${PORT}`));
