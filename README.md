# Uploader gambar ala catbox

## Menjalankan
    npm install
    npm start        # http://localhost:3000

## Pengaturan (opsional, lewat environment variable)
- `PORT`      port server (default 3000)
- `BASE_URL`  domain publik untuk link hasil, mis. https://img.domainanda.com
- `MAX_MB`    batas ukuran file (default 20)

## Cara kerja
- File disimpan di folder `uploads/` dengan nama acak (mis. `a1b2c3d4e5.png`).
- Link permanen: `https://domain-anda/f/a1b2c3d4e5.png`, bisa dipakai di website atau chat mana pun.
- API: `POST /upload` (form-data, field `file`) mengembalikan JSON `{ "url": "..." }`.

## Deploy
Jalankan di VPS, Railway, Render, atau Fly.io. Pasang volume/disk persisten di folder `uploads/`,
kalau tidak file hilang saat server di-redeploy. Pasang HTTPS lewat reverse proxy (Caddy/Nginx).
