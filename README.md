# APS — Aplikasi Pemesanan Tiket Pesawat

Aplikasi fullstack (Next.js, Tailwind, Prisma ORM 8, PostgreSQL) untuk pemesanan tiket pesawat dan manajemen perjalanan.
Dirancang dari user stories dan model konseptual di [`docs/`](docs/) — lihat [`docs/md/implementation-map.md`](docs/md/implementation-map.md)
untuk pemetaan *user story → halaman → service → tes*.

Seluruh antarmuka dan pesan dalam **Bahasa Indonesia**. Waktu penerbangan ditampilkan dalam **WIB**.

## Fitur per peran

| Peran | Fitur |
|---|---|
| **HRD Manager** | Jadwal cuti per periode, pengajuan cuti, riwayat cuti & sisa cuti (US1) |
| **Pengguna** | Cari penerbangan, cari beberapa tujuan, pesan, bayar (simulasi), batalkan (US2, US3) |
| **Member Frequent Traveller** | Semua fitur Pengguna + multi-destinasi, preferensi, bandingkan harga, profil, validasi tiket (US4–US6) |
| **Manager Travel** | Status booking + filter, otorisasi kode booking, cari & pesan untuk pengunjung, kirim ulang e-tiket (US7–US9) |
| **Pengunjung** | Melihat tiket yang dipesankan Manager Travel; menerima e-tiket lewat email (US8) |

## Prasyarat

- Node.js 22+ dan npm
- Docker (untuk PostgreSQL dan Mailpit lokal)

## Mulai cepat (database lokal)

```bash
npm install
cp .env.example .env.local          # lalu isi AUTH_SECRET (lihat di bawah)
npm run db:up                       # PostgreSQL (port 5433) + Mailpit (UI http://localhost:8025)
npm run db:deploy                   # terapkan migrasi di migrations/ ke database lokal (Prisma 8: `db migrate`)
npm run db:seed                     # data contoh: akun per peran, 2.400 penerbangan, cuti, booking
npm run dev                         # http://localhost:3000
```

Buat `AUTH_SECRET` dengan `openssl rand -base64 32` dan tempel ke `.env.local`.

> Postgres lokal memakai **port 5433** (bukan 5432) agar tidak bentrok dengan Postgres lain di mesin Anda. Ubah dengan `POSTGRES_PORT`
> di lingkungan shell sebelum `npm run db:up` dan sesuaikan `DATABASE_URL_LOCAL`.

### Akun demo

Kata sandi semua akun: **`Demo#12345`**

| Email | Peran | Catatan |
|---|---|---|
| `hrd@aps.test` | HRD Manager | |
| `pengguna@aps.test` | Pengguna | punya pesanan di tiap status |
| `member@aps.test` | Member | profil **lengkap** |
| `member2@aps.test` | Member | profil **kosong** → uji pesan `data profil tidak lengkap` |
| `travel@aps.test` | Manager Travel | kode booking contoh: `AP9C4N`, `AP5T3K`, `AP4J9V` |
| `pengunjung1@aps.test`, `pengunjung2@aps.test` | Pengunjung | |

## Beralih antara database lokal dan cloud

Satu variabel, `DB_TARGET`, memilih database; kode aplikasi tidak berubah (keduanya lewat driver `pg`).

| `DB_TARGET` | URL yang dipakai |
|---|---|
| `local` (bawaan) | `DATABASE_URL_LOCAL` (Postgres docker compose) |
| `cloud` | `DATABASE_URL_CLOUD` — URL koneksi **langsung** `postgres://…` dari Prisma Postgres |

```bash
npm run db:target          # tampilkan target aktif (kata sandi disamarkan)
```

Menyiapkan Prisma Postgres:

1. Buat database di [Prisma Data Platform](https://console.prisma.io) dan salin **URL koneksi langsung** (`postgres://USER:PASS@db.prisma.io:5432/postgres?sslmode=require`). URL `prisma+postgres://` (Accelerate) **tidak** dipakai.
2. Isi `.env.local`: `DB_TARGET=cloud` dan `DATABASE_URL_CLOUD=…`
3. `npm run db:deploy` — menerapkan migrasi ke cloud.
4. (Opsional) `npm run db:seed -- --force-cloud` — mengisi data contoh. **Menghapus data lama.**
5. Kembali ke lokal: `DB_TARGET=local`.

Pengaman: `db:migrate` (membuat + menerapkan migrasi baru, setara `migrate dev`) **selalu ditolak** saat `DB_TARGET=cloud`, dan `db:seed` ditolak kecuali dengan `--force-cloud`. Untuk cloud hanya `db:deploy` (menerapkan migrasi yang sudah ada dan di-commit).
Tes selalu memakai database terpisah `aps_test` dan menolak berjalan terhadap database lain.

## Deploy ke Vercel

1. Impor repositori ke Vercel (framework terdeteksi otomatis; build: `next build`). Tidak ada langkah generate: `src/prisma/contract.json` dan `contract.d.ts` sudah di-commit.
2. Set *Environment Variables*:

   | Variabel | Nilai |
   |---|---|
   | `DB_TARGET` | `cloud` |
   | `DATABASE_URL_CLOUD` | URL langsung Prisma Postgres (`postgres://…`) |
   | `AUTH_SECRET` | hasil `openssl rand -base64 32` |
   | `AUTH_URL` | URL produksi: `https://frequent-traveller.vercel.app` |
   | `EMAIL_DRIVER` | `resend` |
   | `RESEND_API_KEY` | API key Resend |
   | `EMAIL_FROM` | mis. `APS <tiket@domain-anda.com>` — domain harus terverifikasi di Resend |

   Integrasi Vercel × Prisma Postgres menyediakan `POSTGRES_URL`; aplikasi memakainya bila `DATABASE_URL_CLOUD` kosong.
3. Terapkan migrasi dari mesin Anda terhadap database cloud: `npm run db:deploy` (dengan `DB_TARGET=cloud` di `.env.local`).
   Build **tidak** membutuhkan database maupun kredensial cloud.
4. Deploy. Untuk host produksi selain Vercel, set `AUTH_TRUST_HOST=true`.

## E-tiket (email)

| `EMAIL_DRIVER` | Perilaku |
|---|---|
| `smtp` (bawaan) | Kirim ke SMTP (`SMTP_HOST`/`SMTP_PORT`, bawaan Mailpit `localhost:1025`). Lihat email di http://localhost:8025 |
| `resend` | Kirim lewat Resend API (`RESEND_API_KEY`, `EMAIL_FROM`) |

Kegagalan kirim tidak membatalkan pesanan: dicatat (`NotifikasiEmail` berstatus `GAGAL`) dan dapat dikirim ulang oleh Manager Travel
dari halaman detail booking.

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` / `build` / `start` | Server pengembangan / build produksi / jalankan build |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Vitest: unit + integrasi (butuh `db:up`; memakai database `aps_test`) |
| `npm run test:e2e` | Playwright (butuh `db:up`; migrasi + seed ulang `aps_test`, port 3100, tidak mengganggu `next dev`) |
| `npm run db:up` / `db:down` | Mulai / hentikan PostgreSQL + Mailpit |
| `npm run db:emit` | `prisma contract emit`: skema → `src/prisma/contract.json` + `contract.d.ts` (commit hasilnya) |
| `npm run db:migrate -- --name x` | emit + `migration plan` + `db migrate` (hanya lokal) |
| `npm run db:deploy` | Terapkan migrasi yang ada (lokal atau cloud) |
| `npm run db:seed` | Isi data contoh (menghapus data lama) |
| `npm run db:verify` · `db:target` | Cek database cocok dengan kontrak · tampilkan target database |

## Struktur

```
src/app/            halaman (App Router): (auth)/login, (app)/{dashboard,penerbangan,pesanan,member,travel,pengunjung,hrd}
src/components/     komponen UI dan komponen per domain (flight, booking, cuti)
src/server/         db, db-target, auth, services (control), validation (zod), email
src/lib/            fungsi murni: waktu WIB, kode booking, status, hitungan cuti
prisma/             schema.prisma (sumber kontrak), seed.ts
migrations/         migrasi Prisma 8 (`app/`) + snapshot kontrak
src/prisma/         contract.json + contract.d.ts (hasil `contract emit`, di-commit)
tests/              unit/, integration/, e2e/
docs/               user stories dan model konseptual (DUMA)
```

Lapisan mengikuti robustness diagram: *boundary* → halaman, *control* → fungsi di `src/server/services`, *entity* → model di `prisma/schema.prisma`, diakses lewat klien Prisma ORM 8 (`db.orm.public.<Model>`).

## Asumsi yang tidak ditentukan user stories

- Booking baru berstatus `booked`; pembayaran **disimulasikan**: `booked → waiting for the payment → confirmed`. `dibatalkan` ada tetapi bukan opsi filter US7.
- Cuti pegawai: sisa cuti = jatah tahunan (12) − riwayat cuti tahun berjalan. Periode = tahun + bulan (wajib), tanggal opsional; pengajuan ditampilkan bila beririsan dengan periode.
- Profil member "lengkap" bila semua kolom (nama lengkap, tanggal lahir, NIK, paspor, telepon, kewarganegaraan, alamat) terisi.
- Multi-destinasi = beberapa ruas (asal→tujuan, tanggal); total harga memakai penerbangan termurah tiap ruas.
- Saat Manager Travel memesan untuk pengunjung baru, akun login pengunjung dibuat dengan kata sandi sementara yang ditampilkan **sekali** kepada manajer.
- Tiap pemesanan memuat satu penerbangan (satu tiket). Pesanan multi-ruas dalam satu booking belum didukung.
