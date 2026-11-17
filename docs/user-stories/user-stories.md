# User Stories

## Daftar Isi

| No. | Aktor | Tujuan Singkat |
|-----|-------|----------------|
| [US1](#us1--melihat-jadwal-cuti-pegawai) | HRD manajer | Melihat jadwal cuti pegawai |
| [US2](#us2--memesan-tiket-pesawat-sesuai-preferensi) | Pengguna | Memesan tiket pesawat sesuai preferensi |
| [US3](#us3--mencari-penerbangan-untuk-beberapa-tujuan) | Pengguna | Mencari penerbangan untuk beberapa tujuan |
| [US4](#us4--mencari-penerbangan-multi-destinasi) | Member frequent traveller | Mencari penerbangan multi-destinasi |
| [US5](#us5--melengkapi-data-personal-dan-validasi-tiket) | Member frequent traveller | Melengkapi data personal untuk validasi tiket |
| [US6](#us6--membandingkan-penerbangan-berdasarkan-preferensi) | Member frequent traveller | Membandingkan penerbangan berdasarkan preferensi |
| [US7](#us7--memeriksa-otorisasi-travel) | Manajer travel | Memeriksa otorisasi travel dan status booking |
| [US8](#us8--mencari-dan-memesan-tiket-untuk-pengunjung) | Manajer travel | Mencari dan memesan tiket untuk pengunjung |
| [US9](#us9--otorisasi-tiket-yang-sudah-dibooking) | Manajer travel | Otorisasi tiket yang sudah dibooking |
| [US10](#us10--melihat-jadwal-tanpa-login-dan-mendaftar-akun) | Tamu | Melihat jadwal penerbangan tanpa login dan mendaftar akun |

---

## US1 — Melihat Jadwal Cuti Pegawai

> **Sebagai** seorang HRD manajer,
> **saya ingin** memilih jadwal cuti,
> **sehingga** saya bisa melihat siapa saja yang akan mengambil cuti dan berapa lama waktu cuti yang diambil.

### Task

- **a.** HRD manajer dapat memilih tanggal, bulan, dan tahun.
  - *Sistem* menampilkan data pegawai yang mengajukan permohonan cuti sesuai periode yang dipilih HRD manajer.
- **b.** HRD manajer memilih periode yang diinginkan.
  - *Sistem* menampilkan nama pegawai, periode cuti yang diajukan, dan berapa lama waktu cuti yang diajukan.
- **c.** HRD manajer memilih nama pegawai yang diinginkan.
  - *Sistem* menampilkan riwayat cuti pegawai dan sisa waktu cuti yang dimiliki pegawai pada tahun berjalan.

### Acceptance Criteria

- **a.** HRD manajer dapat memilih periode cuti semua pegawai.
- **b.** HRD manajer dapat melihat pengajuan cuti masing-masing pegawai.
- **c.** HRD manajer dapat melihat riwayat cuti masing-masing pegawai.

---

## US2 — Memesan Tiket Pesawat Sesuai Preferensi

> **Sebagai** seorang pengguna,
> **saya memerlukan** tiket pesawat sesuai preferensi yang diinginkan,
> **sehingga** saya dapat memesan tiket.

### Task

- **a.** Pengguna dapat mencari jadwal penerbangan sesuai tujuan yang diinginkan (pencarian terbuka tanpa login, lihat US10).
  - *Sistem* menampilkan jadwal penerbangan, maskapai, dan harga tiket.
- **b.** Pengguna dapat memesan tiket pesawat yang diinginkan.
  - *Sistem* menampilkan pilihan tiket pesawat beserta maskapai.
- **c.** Pengguna dapat membatalkan tiket pesawat yang diinginkan.
  - *Sistem* menampilkan data pesanan yang tersedia dan membatalkan pesanan.

### Acceptance Criteria

- **a.** Pengguna dapat mencari jadwal penerbangan sesuai tujuan yang diinginkan.
- **b.** Pengguna dapat melihat harga tiket untuk masing-masing maskapai sesuai jadwal dan tujuan yang diinginkan.
- **c.** Pengguna dapat memesan tiket sesuai preferensinya.

---

## US3 — Mencari Penerbangan untuk Beberapa Tujuan

> **Sebagai** pengguna,
> **saya ingin** mencari jadwal penerbangan untuk beberapa tujuan penerbangan,
> **sehingga** saya dapat melihat daftar penerbangan yang tersedia.

### Task

- Pengguna dapat mencari jadwal penerbangan untuk beberapa tujuan penerbangan.
  - *Sistem* menampilkan jadwal penerbangan, maskapai, dan harga tiket.

### Acceptance Criteria

- **a.** Pengguna dapat mencari jadwal penerbangan untuk beberapa tujuan penerbangan.
- **b.** Pengguna dapat melihat jadwal penerbangan, maskapai, dan harga tiket yang tersedia.

---

## US4 — Mencari Penerbangan Multi-Destinasi

> **Sebagai** member frequent traveller,
> **saya ingin** mencari penerbangan multi-destinasi sesuai preferensi saya,
> **sehingga** saya dapat membandingkan harga dan jumlah penerbangan.

### Task

- **a.** Member frequent traveller dapat mencari penerbangan multi-destinasi berdasarkan **tanggal**.
  - *Sistem* menampilkan jadwal dan harga penerbangan multi-destinasi sesuai pilihan member frequent traveller.
- **b.** Member frequent traveller dapat mencari penerbangan multi-destinasi berdasarkan **lokasi keberangkatan**.
  - *Sistem* menampilkan jadwal dan harga penerbangan multi-destinasi sesuai pilihan member frequent traveller.
- **c.** Member frequent traveller dapat mencari penerbangan multi-destinasi berdasarkan **tujuan penerbangan**.
  - *Sistem* menampilkan jadwal dan harga penerbangan multi-destinasi sesuai pilihan member frequent traveller.

### Acceptance Criteria

- Member frequent traveller dapat mencari penerbangan multi-destinasi berdasarkan tanggal, lokasi keberangkatan, dan tujuan.

---

## US5 — Melengkapi Data Personal dan Validasi Tiket

> **Sebagai** member frequent traveller,
> **saya ingin** melengkapi data personal saya,
> **sehingga** saya dapat melakukan validasi tiket.

### Task

- **a.** Member frequent traveller dapat mengupdate data profil.
  - *Sistem* dapat menyimpan data profil yang telah diupdate.
- **b.** Member frequent traveller dapat melakukan validasi tiket jika data profil sudah lengkap.
  - *Sistem* dapat memberikan validasi tiket berdasarkan data profil yang tersedia.
- **c.** Saat member frequent traveller melakukan validasi tiket dengan data profil tidak lengkap:
  - *Sistem* mengirimkan pesan **"data profil tidak lengkap"**.
  - *Sistem* menolak proses validasi tiket hingga data profil dinyatakan lengkap.

### Acceptance Criteria

- **a.** Member frequent traveller dapat mengupdate data profil.
- **b.** Member frequent traveller dapat melakukan validasi tiket menggunakan data profil.

---

## US6 — Membandingkan Penerbangan Berdasarkan Preferensi

> **Sebagai** member frequent traveller,
> **saya ingin** membandingkan penerbangan yang tersedia berdasarkan preferensi yang saya pilih,
> **sehingga** saya dapat memilih penerbangan paling sesuai.

### Task

- **a.** Member frequent traveller dapat melihat penerbangan yang tersedia sesuai preferensi tujuan, tanggal, dan jam keberangkatan.
  - *Sistem* dapat menampilkan data penerbangan sesuai preferensi member frequent traveller.
- **b.** Member frequent traveller dapat membandingkan harga tiket penerbangan yang tersedia sesuai preferensi tujuan, tanggal, dan jam keberangkatan.
  - *Sistem* dapat menampilkan data penerbangan sesuai preferensi member frequent traveller.
- **c.** Member frequent traveller dapat memesan tiket sesuai pilihan yang tersedia.
  - *Sistem* dapat menampilkan halaman pemesanan.

### Acceptance Criteria

- **a.** Member frequent traveller dapat melihat penerbangan yang tersedia sesuai preferensi.
- **b.** Member frequent traveller dapat membandingkan harga tiket penerbangan yang tersedia sesuai preferensi.
- **c.** Member frequent traveller dapat memesan tiket sesuai pilihan yang tersedia.

---

## US7 — Memeriksa Otorisasi Travel

> **Sebagai** manajer travel,
> **saya dapat** memeriksa otorisasi travel,
> **sehingga** saya dapat memastikan pemesanan tiket.

### Task

- **a.** Manajer travel dapat melihat semua status booking.
  - *Sistem* menampilkan semua status booking yang tersedia.
- **b.** Manajer travel dapat memilih status booking berdasarkan preferensinya (`confirmed`, `booked`, `waiting for the payment`).
  - *Sistem* menampilkan status booking sesuai preferensi manajer travel.

### Acceptance Criteria

- Manajer travel dapat melihat semua status booking dan memfilter status booking tertentu sesuai preferensi.

---

## US8 — Mencari dan Memesan Tiket untuk Pengunjung

> **Sebagai** manajer travel,
> **saya ingin** melakukan pencarian tiket penerbangan untuk pengunjung,
> **sehingga** saya dapat melakukan pemesanan tiket untuk pengunjung.

### Task

- **a.** Travel manajer dapat mencari tiket penerbangan tertentu.
  - *Sistem* menampilkan tiket penerbangan sesuai yang diinginkan travel manajer.
- **b.** Travel manajer dapat memesan tiket penerbangan menggunakan data pengunjung.
  - *Sistem* menyimpan data pesanan tiket atas nama pengunjung.

### Acceptance Criteria

- **a.** Travel manajer dapat mencari tiket penerbangan ke tujuan tertentu.
- **b.** Travel manajer dapat memesan tiket menggunakan data pengunjung.
- **c.** Pengunjung dapat melihat tiket yang telah terpesan di akunnya.
- **d.** Pengunjung menerima e-tiket melalui email yang terdaftar.

---

## US9 — Otorisasi Tiket yang Sudah Dibooking

> **Sebagai** manajer travel,
> **saya ingin** melakukan otorisasi tiket pesawat yang sudah dibooking,
> **sehingga** saya dapat memverifikasi status booking.

### Task

- **a.** Manajer travel dapat melakukan otorisasi tiket menggunakan kode booking reference.
  - *Sistem* menampilkan status booking tiket sesuai kode booking reference.
- **b.** Jika kode booking reference yang diinputkan manajer travel tidak sesuai:
  - *Sistem* menampilkan pesan **"kode booking reference tidak sesuai"**.
  - *Sistem* meminta manajer travel untuk mengulang input kode booking reference.

### Acceptance Criteria

- **a.** Manajer travel dapat melakukan otorisasi tiket.
- **b.** Manajer travel dapat melihat status booking.

---

## US10 — Melihat Jadwal Tanpa Login dan Mendaftar Akun

> **Sebagai** seorang tamu (pengunjung situs yang belum login),
> **saya ingin** melihat jadwal penerbangan dan mendaftar akun,
> **sehingga** saya dapat membandingkan jadwal dan harga sebelum memutuskan memesan tiket.

### Task

- **a.** Tamu dapat mencari jadwal penerbangan (satu tujuan maupun beberapa tujuan) tanpa login.
  - *Sistem* menampilkan jadwal penerbangan, maskapai, dan harga tiket yang sama seperti untuk pengguna yang login.
- **b.** Tamu dapat mendaftarkan akun dengan nama, email, dan kata sandi.
  - *Sistem* membuat akun berperan Pengguna, langsung memasukkan tamu ke akunnya, dan menolak email yang sudah terdaftar dengan pesan **"Email sudah terdaftar."**
- **c.** Tamu yang memilih memesan sebuah penerbangan diminta login terlebih dahulu.
  - *Sistem* mengarahkan tamu ke halaman login (atau daftar), lalu mengembalikannya ke formulir pemesanan penerbangan yang dipilih setelah berhasil masuk.

### Acceptance Criteria

- **a.** Tamu dapat melihat jadwal, maskapai, dan harga penerbangan tanpa login.
- **b.** Tamu dapat mendaftar akun; akun baru selalu berperan Pengguna.
- **c.** Pemesanan, pembatalan, dan seluruh halaman selain jadwal tetap hanya dapat diakses setelah login.
