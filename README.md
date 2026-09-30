# Uploader gambar ala catbox

## Menjalankan
    npm install
    npm start        # http://localhost:3000

## Pengaturan (opsional, lewat environment variable)
- `PORT`      port server (default 3000)
- `BASE_URL`  domain publik untuk link hasil, mis. https://img.domainanda.com
- `MAX_MB`    batas ukuran file (default 20)
- `DATA_DIR`  lokasi database dan file (default `./data`)
- `ADMIN_TOKEN` (opsional) kata sandi admin untuk melihat dan menghapus semua unggahan

## Cara kerja
- File disimpan di `data/uploads/` dengan nama acak (mis. `a1b2c3d4e5.png`).
- Metadata (nama asli, ukuran, tipe, IP, waktu) disimpan di SQLite: `data/data.db`.
- Tiap unggahan mendapat `deleteToken`; riwayat dan tombol hapus tersimpan di browser pengunggah.
- Link permanen: `https://domain-anda/f/a1b2c3d4e5.png`, bisa dipakai di website atau chat mana pun.
- API: `POST /upload` (form-data, field `file`) mengembalikan JSON `{ "url": "..." }`.

## Deploy
Jalankan di VPS, Railway, Render, atau Fly.io. Pasang volume/disk persisten di folder `data/` (berisi database dan gambar),
kalau tidak file hilang saat server di-redeploy. Pasang HTTPS lewat reverse proxy (Caddy/Nginx).

## API
- `POST /upload` mengembalikan `url`, `filename`, `deleteToken`.
- `POST /delete` body JSON `{filename, token}`.
- `GET /api/uploads?limit=50&offset=0` dengan header `x-admin-token` (butuh `ADMIN_TOKEN`).

## Cadangan
Salin folder `data/` secara berkala. Hentikan server atau gunakan `sqlite3 data.db ".backup ..."` agar database konsisten.
