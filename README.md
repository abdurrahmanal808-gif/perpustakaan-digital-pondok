# Perpustakaan Digital Pondok

Web app perpustakaan online berbasis Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, Supabase Storage, dan opsi Cloudflare R2 untuk file baru.

## Arsitektur

Auth tidak memakai Supabase Auth. Aplikasi memakai custom username/password auth:

- Password di-hash dengan bcrypt.
- Session token dibuat acak, token asli disimpan di HttpOnly cookie.
- Database hanya menyimpan hash session token.
- Semua operasi sensitif lewat server action atau API route.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server.
- Direct client access ke tabel dan storage ditolak lewat RLS.
- File lama bisa tetap di Supabase Storage, sementara upload baru bisa diarahkan ke Cloudflare R2.

Pendekatan moderasi paling aman di project ini: semua upload user masuk status `pending`. Admin harus menerbitkan buku dari dashboard admin. Ini mencegah konten publik langsung muncul tanpa pemeriksaan.

## Struktur Folder

```txt
src/
  app/
    (auth)/login
    (auth)/register
    admin/
    api/books/
    books/[id]/
    catalog/
    dashboard/
  components/
    auth/
    books/
    layout/
    ui/
  lib/
    admin/
    auth/
    books/
    db/
    favorites/
    reading/
    security/
    shelves/
    storage/
    validations/
supabase/
  schema.sql
```

## Setup Supabase

1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Jalankan seluruh isi `supabase/schema.sql`.
4. Schema akan membuat:
   - tabel `users`
   - tabel `sessions`
   - tabel `categories`
   - tabel `books`
   - tabel `book_files`
   - tabel `favorites`
   - tabel `shelves`
   - tabel `shelf_books`
   - tabel `reading_history`
   - tabel `downloads`
   - tabel `book_views`
  - bucket private `book-files`
  - bucket private `book-covers`

Jika project sudah berjalan dan hanya ingin menambah dukungan R2, jalankan juga `supabase/r2-storage.sql`.

## Environment Variables

Salin `.env.example` menjadi `.env.local`.

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SESSION_SECRET=generate-a-long-random-secret-minimum-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
BOOK_FILES_BUCKET=book-files
BOOK_COVERS_BUCKET=book-covers
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=maktabah-files
UPLOAD_STORAGE_PROVIDER=auto
```

Yang harus diganti:

- `SUPABASE_URL`: URL project Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase. Jangan taruh di frontend.
- `SESSION_SECRET`: string random panjang, minimal 32 karakter.
- `NEXT_PUBLIC_APP_URL`: ganti ke domain Vercel saat deploy.
- `R2_*`: credential Cloudflare R2. Kalau semua terisi, upload baru masuk R2.
- `UPLOAD_STORAGE_PROVIDER`: isi `auto`, `r2`, atau `supabase`. Default aman adalah `auto`.

## Cloudflare R2 Hybrid Storage

Mode hybrid menjaga file lama tetap berjalan:

- `storage_provider = 'supabase'`: file lama dibaca dari Supabase Storage.
- `storage_provider = 'r2'`: file baru dibaca dari Cloudflare R2.
- Metadata buku tetap disimpan di Supabase PostgreSQL.
- Baca/download tetap lewat server dan signed URL, credential R2 tidak pernah dikirim ke frontend.

Langkah setup:

1. Buat bucket R2 di Cloudflare.
2. Buat R2 API token/credential dengan akses bucket.
3. Isi `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, dan `R2_BUCKET_NAME`.
4. Jalankan SQL `supabase/r2-storage.sql`.
5. Deploy ulang aplikasi.

Jika env R2 belum lengkap dan `UPLOAD_STORAGE_PROVIDER=auto`, upload baru tetap memakai Supabase Storage.

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Jika PowerShell Windows memblokir `npm`, gunakan:

```bash
npm.cmd install
npm.cmd run dev
```

## Membuat Admin Pertama

1. Register user dari halaman `/register`.
2. Di Supabase SQL Editor, jalankan:

```sql
update public.users
set role = 'admin'
where username = 'username_anda';
```

3. Logout lalu login ulang. Menu Admin akan muncul.

## Fitur Yang Sudah Dibuat

- Landing page
- Register username/password
- Login username/password
- Logout
- Dashboard user
- Upload buku PDF atau scan gambar
- Cover buku opsional
- Validasi server-side file type dan total ukuran 50MB
- Katalog publik dengan search, filter, sort
- Detail buku
- Reader PDF
- Reader scan gambar dengan next, previous, grid, zoom sederhana
- Download file aman via signed URL
- Buku Saya
- Edit metadata dan cover
- Hapus buku dan file storage
- Favorit
- Rak buku pribadi
- Riwayat baca
- Profil user
- Admin dashboard
- Admin user management
- Admin category management
- Admin book management
- 404, loading, dan empty state dasar

## Catatan Keamanan

- Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke browser.
- Jangan memakai `localStorage` untuk session.
- Bucket storage dibuat private.
- File dibuka/download memakai signed URL.
- Credential Cloudflare R2 hanya dipakai di server.
- User yang diblokir tidak bisa login dan session aktifnya dicabut oleh admin.
- User hanya bisa mengedit dan menghapus buku miliknya sendiri.
- Admin bisa menerbitkan, menyembunyikan, dan menghapus buku.

## Deploy ke Vercel

1. Push project ke GitHub.
2. Import repository ke Vercel.
3. Isi environment variables yang sama seperti `.env.local`.
4. Set `NEXT_PUBLIC_APP_URL` ke domain Vercel.
5. Deploy.

## Bagian Yang Perlu Disesuaikan

- Nama aplikasi di `src/lib/constants.ts`.
- Daftar kategori awal di `supabase/schema.sql`.
- Warna dan gaya Tailwind di `tailwind.config.ts`.
- Kebijakan moderasi jika ingin user tertentu bisa langsung publish.
- Batas ukuran file di `src/lib/constants.ts` dan bucket Supabase.
- Domain production di `NEXT_PUBLIC_APP_URL`.
