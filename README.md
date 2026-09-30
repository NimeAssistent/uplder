# Uploader gambar ala catbox, untuk Vercel

Gambar disimpan di **Vercel Blob** (link publik permanen), metadata di **Postgres (Neon)**.

## Setup
1. Push folder ini ke GitHub, lalu import sebagai project di Vercel.
2. Di project Vercel, buka tab **Storage**:
   - **Create Database → Blob** (hubungkan ke project; otomatis membuat `BLOB_READ_WRITE_TOKEN`).
   - **Create Database → Neon (Postgres)** dari Marketplace (otomatis membuat `DATABASE_URL`).
3. (Opsional) Tambah environment variable `ADMIN_TOKEN` (kata sandi bebas) dan `MAX_MB` (default 20).
4. Redeploy. Tabel dibuat otomatis saat pertama kali dipakai.

## Lokal
    npm i -g vercel
    npm install
    vercel link && vercel env pull .env.local
    vercel dev

## API
- `POST /api/upload`   token unggah (dipakai `@vercel/blob/client`)
- `POST /api/register` `{url, name}` → `{url, deleteToken}`
- `POST /api/delete`   `{url, token}`
- `GET  /api/list`     header `x-admin-token` (butuh `ADMIN_TOKEN`)
