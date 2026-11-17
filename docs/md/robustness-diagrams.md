# Robustness Diagrams (ICONIX) — APS

Sumber: `docs/duma/APS-generated.dfd.json` (diagram `rb_01`…`rb_18`). Dokumen ini ringkasan teks untuk agen/pembaca; sumber kebenaran struktur tetap berkas JSON DUMA, sedangkan kebutuhan fungsional ada di `docs/user-stories/user-stories.md`.

## Konvensi

- Bahasa: Indonesia. Satu diagram = satu use case (alur utama + alternatif di catatan).
- Tipe node DUMA: `rb-actor`, `rb-boundary` (antarmuka, kata benda), `rb-control` (tindakan, kata kerja), `rb-entity` (objek domain, nama kelas pada class diagram), `note`.
- Koneksi yang sah: Aktor–Boundary, Boundary–Control, Control–Entity, Control–Control. Semua relasi `association` (tanpa arah); label memakai format `permintaan / respons`.
- Id node: `rNN_<kunci>`, id garis: `rNN_iK`, id diagram: `rb_NN`. Pasangan sequence: `sq_NN` (lihat `docs/md/sequence-diagrams.md`).
- Aktor: HRD Manager, Pengguna, Member Frequent Traveller, Manager Travel, Pengunjung. Entity "Profil Member" = data profil milik kelas Member Frequent Traveller; "Data Pengunjung" = kelas Pengunjung.
- Pesan wajib verbatim: "data profil tidak lengkap" (RB10), "kode booking reference tidak sesuai" (RB16). Status booking: `confirmed`, `booked`, `waiting for the payment` (RB13); booking baru berstatus `booked` (asumsi).

## Daftar Isi

| No. | Use case | Diagram | Sequence |
|---|---|---|---|
| RB01 | [Melihat Jadwal Cuti Pegawai (US1-a)](#rb01--melihat-jadwal-cuti-pegawai-us1-a) | `rb_01` | `sq_01` |
| RB02 | [Melihat Pengajuan Cuti Pegawai (US1-b)](#rb02--melihat-pengajuan-cuti-pegawai-us1-b) | `rb_02` | `sq_02` |
| RB03 | [Melihat Riwayat Cuti Pegawai (US1-c)](#rb03--melihat-riwayat-cuti-pegawai-us1-c) | `rb_03` | `sq_03` |
| RB04 | [Melihat Jadwal Penerbangan (US2-a)](#rb04--melihat-jadwal-penerbangan-us2-a) | `rb_04` | `sq_04` |
| RB05 | [Mencari Penerbangan Beberapa Tujuan (US3)](#rb05--mencari-penerbangan-beberapa-tujuan-us3) | `rb_05` | `sq_05` |
| RB06 | [Mencari Penerbangan Multi-Destinasi (US4)](#rb06--mencari-penerbangan-multi-destinasi-us4) | `rb_06` | `sq_06` |
| RB07 | [Memesan Tiket Pesawat (US2-b, US6-c)](#rb07--memesan-tiket-pesawat-us2-b-us6-c) | `rb_07` | `sq_07` |
| RB08 | [Membatalkan Tiket Pesawat (US2-c)](#rb08--membatalkan-tiket-pesawat-us2-c) | `rb_08` | `sq_08` |
| RB09 | [Mengupdate Data Profil (US5-a)](#rb09--mengupdate-data-profil-us5-a) | `rb_09` | `sq_09` |
| RB10 | [Melakukan Validasi Tiket (US5-b, US5-c)](#rb10--melakukan-validasi-tiket-us5-b-us5-c) | `rb_10` | `sq_10` |
| RB11 | [Melihat Penerbangan Sesuai Preferensi (US6-a)](#rb11--melihat-penerbangan-sesuai-preferensi-us6-a) | `rb_11` | `sq_11` |
| RB12 | [Membandingkan Harga Tiket Penerbangan (US6-b)](#rb12--membandingkan-harga-tiket-penerbangan-us6-b) | `rb_12` | `sq_12` |
| RB13 | [Melihat Status Booking (US7)](#rb13--melihat-status-booking-us7) | `rb_13` | `sq_13` |
| RB14 | [Mencari Tiket Penerbangan (US8-a)](#rb14--mencari-tiket-penerbangan-us8-a) | `rb_14` | `sq_14` |
| RB15 | [Memesan Tiket Menggunakan Data Pengunjung (US8-b)](#rb15--memesan-tiket-menggunakan-data-pengunjung-us8-b) | `rb_15` | `sq_15` |
| RB16 | [Mengotorisasi Tiket yang Sudah Dibooking (US9)](#rb16--mengotorisasi-tiket-yang-sudah-dibooking-us9) | `rb_16` | `sq_16` |
| RB17 | [Melihat Tiket yang Terpesan (US8-c)](#rb17--melihat-tiket-yang-terpesan-us8-c) | `rb_17` | `sq_17` |
| RB18 | [Menerima E-Tiket (US8-d)](#rb18--menerima-e-tiket-us8-d) | `rb_18` | `sq_18` |

---

## RB01 — Melihat Jadwal Cuti Pegawai (US1-a)

Diagram: `rb_01` · Pasangan sequence: `sq_01`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | HRD Manager | `r01_a` |
| Boundary | Halaman Jadwal Cuti | `r01_b` |
| Control | Validasi Periode Cuti | `r01_c1` |
| Control | Mengambil Jadwal Cuti | `r01_c2` |
| Entity | Permohonan Cuti | `r01_e1` |
| Entity | Pegawai | `r01_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| HRD Manager | Halaman Jadwal Cuti | pilih tanggal, bulan, tahun / lihat daftar pegawai cuti |
| Halaman Jadwal Cuti | Validasi Periode Cuti | kirim periode / tampilkan error bila periode tidak valid |
| Validasi Periode Cuti | Mengambil Jadwal Cuti | periode valid |
| Mengambil Jadwal Cuti | Halaman Jadwal Cuti | kirim daftar pegawai yang mengajukan cuti |
| Mengambil Jadwal Cuti | Permohonan Cuti | ambil permohonan cuti sesuai periode |
| Mengambil Jadwal Cuti | Pegawai | ambil data pegawai |

### Narasi

> Use case: Melihat jadwal cuti pegawai (US1-a).
> Alur utama: HRD Manager memilih tanggal, bulan, dan tahun pada Halaman Jadwal Cuti. Halaman meminta Validasi Periode Cuti; bila valid, Mengambil Jadwal Cuti membaca Permohonan Cuti sesuai periode dan data Pegawai, lalu Halaman menampilkan pegawai yang mengajukan cuti.
> Alternatif: periode tidak valid (mis. bulan/tahun kosong), Halaman menampilkan pesan kesalahan. Pemilihan berdasarkan periode atau nama (extend) memakai objek yang sama.

---

## RB02 — Melihat Pengajuan Cuti Pegawai (US1-b)

Diagram: `rb_02` · Pasangan sequence: `sq_02`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | HRD Manager | `r02_a` |
| Boundary | Halaman Pengajuan Cuti | `r02_b` |
| Control | Validasi Periode Cuti | `r02_c1` |
| Control | Mengambil Pengajuan Cuti | `r02_c2` |
| Entity | Permohonan Cuti | `r02_e1` |
| Entity | Pegawai | `r02_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| HRD Manager | Halaman Pengajuan Cuti | pilih periode / lihat pengajuan cuti |
| Halaman Pengajuan Cuti | Validasi Periode Cuti | kirim periode / tampilkan error bila periode tidak valid |
| Validasi Periode Cuti | Mengambil Pengajuan Cuti | periode valid |
| Mengambil Pengajuan Cuti | Halaman Pengajuan Cuti | kirim nama pegawai, periode, dan lama cuti |
| Mengambil Pengajuan Cuti | Permohonan Cuti | ambil periode dan lama cuti yang diajukan |
| Mengambil Pengajuan Cuti | Pegawai | ambil nama pegawai |

### Narasi

> Use case: Melihat pengajuan cuti pegawai (US1-b).
> Alur utama: HRD Manager memilih periode pada Halaman Pengajuan Cuti. Setelah Validasi Periode Cuti lolos, Mengambil Pengajuan Cuti membaca Permohonan Cuti dan Pegawai; Halaman menampilkan nama pegawai, periode cuti, dan lama cuti yang diajukan.
> Alternatif: periode tidak valid, Halaman menampilkan pesan kesalahan.

---

## RB03 — Melihat Riwayat Cuti Pegawai (US1-c)

Diagram: `rb_03` · Pasangan sequence: `sq_03`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | HRD Manager | `r03_a` |
| Boundary | Halaman Riwayat Cuti | `r03_b` |
| Control | Mengambil Riwayat Cuti | `r03_c1` |
| Control | Menghitung Sisa Cuti | `r03_c2` |
| Entity | Pegawai | `r03_e1` |
| Entity | Riwayat Cuti | `r03_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| HRD Manager | Halaman Riwayat Cuti | pilih nama pegawai / lihat riwayat dan sisa cuti |
| Halaman Riwayat Cuti | Mengambil Riwayat Cuti | minta riwayat cuti / terima riwayat dan sisa cuti, atau error |
| Mengambil Riwayat Cuti | Pegawai | cari pegawai |
| Mengambil Riwayat Cuti | Riwayat Cuti | ambil riwayat cuti pegawai |
| Mengambil Riwayat Cuti | Menghitung Sisa Cuti | hitung sisa cuti tahun berjalan |

### Narasi

> Use case: Melihat riwayat cuti pegawai (US1-c).
> Alur utama: HRD Manager memilih nama pegawai pada Halaman Riwayat Cuti. Mengambil Riwayat Cuti mencari Pegawai dan membaca Riwayat Cuti, Menghitung Sisa Cuti menghitung sisa cuti tahun berjalan, lalu Halaman menampilkan riwayat dan sisa cuti.
> Alternatif: pegawai tidak ditemukan, Halaman menampilkan pesan kesalahan.

---

## RB04 — Melihat Jadwal Penerbangan (US2-a)

Diagram: `rb_04` · Pasangan sequence: `sq_04`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengguna | `r04_a0` |
| Aktor | Member Frequent Traveller | `r04_a1` |
| Boundary | Halaman Pencarian Penerbangan | `r04_b` |
| Control | Validasi Input Pencarian | `r04_c1` |
| Control | Mencari Penerbangan | `r04_c2` |
| Entity | Penerbangan | `r04_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengguna | Halaman Pencarian Penerbangan | isi tujuan dan tanggal / lihat hasil pencarian |
| Member Frequent Traveller | Halaman Pencarian Penerbangan | isi tujuan dan tanggal / lihat hasil pencarian |
| Halaman Pencarian Penerbangan | Validasi Input Pencarian | kirim tujuan dan tanggal / tampilkan error bila input tidak valid |
| Validasi Input Pencarian | Mencari Penerbangan | input valid |
| Mencari Penerbangan | Halaman Pencarian Penerbangan | kirim jadwal, maskapai, dan harga tiket |
| Mencari Penerbangan | Penerbangan | ambil penerbangan sesuai tujuan dan tanggal |

### Narasi

> Use case: Melihat jadwal penerbangan (US2-a, US3-b).
> Alur utama: Pengguna atau Member Frequent Traveller mengisi tujuan dan tanggal pada Halaman Pencarian Penerbangan. Setelah Validasi Input Pencarian lolos, Mencari Penerbangan membaca Penerbangan; Halaman menampilkan jadwal, maskapai, dan harga tiket.
> Alternatif: input tidak valid, Halaman menampilkan pesan kesalahan; tidak ada penerbangan, Halaman menampilkan daftar kosong.

---

## RB05 — Mencari Penerbangan Beberapa Tujuan (US3)

Diagram: `rb_05` · Pasangan sequence: `sq_05`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengguna | `r05_a` |
| Boundary | Halaman Pencarian Multi Tujuan | `r05_b` |
| Control | Validasi Daftar Tujuan | `r05_c1` |
| Control | Mencari Penerbangan per Tujuan | `r05_c2` |
| Control | Menggabungkan Hasil Pencarian | `r05_c3` |
| Entity | Penerbangan | `r05_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengguna | Halaman Pencarian Multi Tujuan | isi beberapa tujuan / lihat daftar penerbangan |
| Halaman Pencarian Multi Tujuan | Validasi Daftar Tujuan | kirim daftar tujuan / tampilkan error bila tidak valid |
| Validasi Daftar Tujuan | Mencari Penerbangan per Tujuan | daftar tujuan valid |
| Mencari Penerbangan per Tujuan | Penerbangan | ambil penerbangan tiap tujuan |
| Mencari Penerbangan per Tujuan | Menggabungkan Hasil Pencarian | serahkan hasil per tujuan |
| Menggabungkan Hasil Pencarian | Halaman Pencarian Multi Tujuan | kirim jadwal, maskapai, dan harga tiket |

### Narasi

> Use case: Mencari jadwal penerbangan untuk beberapa tujuan (US3).
> Alur utama: Pengguna mengisi beberapa tujuan pada Halaman Pencarian Multi Tujuan. Validasi Daftar Tujuan lolos, Mencari Penerbangan per Tujuan membaca Penerbangan untuk tiap tujuan, Menggabungkan Hasil Pencarian menyatukannya, dan Halaman menampilkan jadwal, maskapai, dan harga tiket.
> Alternatif: daftar tujuan kosong/tidak valid, Halaman menampilkan pesan kesalahan.

---

## RB06 — Mencari Penerbangan Multi-Destinasi (US4)

Diagram: `rb_06` · Pasangan sequence: `sq_06`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Member Frequent Traveller | `r06_a` |
| Boundary | Halaman Pencarian Multi-Destinasi | `r06_b` |
| Control | Validasi Kriteria Pencarian | `r06_c1` |
| Control | Mencari Penerbangan Multi-Destinasi | `r06_c2` |
| Control | Menghitung Total Harga dan Jumlah Penerbangan | `r06_c3` |
| Entity | Penerbangan | `r06_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Member Frequent Traveller | Halaman Pencarian Multi-Destinasi | isi tanggal, lokasi keberangkatan, tujuan / lihat hasil |
| Halaman Pencarian Multi-Destinasi | Validasi Kriteria Pencarian | kirim kriteria / tampilkan error bila tidak valid |
| Validasi Kriteria Pencarian | Mencari Penerbangan Multi-Destinasi | kriteria valid |
| Mencari Penerbangan Multi-Destinasi | Penerbangan | ambil penerbangan tiap rute |
| Mencari Penerbangan Multi-Destinasi | Menghitung Total Harga dan Jumlah Penerbangan | serahkan rute hasil pencarian |
| Menghitung Total Harga dan Jumlah Penerbangan | Halaman Pencarian Multi-Destinasi | kirim jadwal, harga, dan jumlah penerbangan |

### Narasi

> Use case: Mencari penerbangan multi-destinasi (US4-a/b/c).
> Alur utama: Member Frequent Traveller mengisi tanggal, lokasi keberangkatan, dan tujuan. Setelah Validasi Kriteria Pencarian lolos, Mencari Penerbangan Multi-Destinasi membaca Penerbangan tiap rute, Menghitung Total Harga dan Jumlah Penerbangan menyusun perbandingannya, dan Halaman menampilkan jadwal serta harga multi-destinasi.
> Alternatif: kriteria tidak lengkap, Halaman menampilkan pesan kesalahan. Pencarian berdasarkan tanggal, keberangkatan, atau tujuan (extend) memakai objek yang sama.

---

## RB07 — Memesan Tiket Pesawat (US2-b, US6-c)

Diagram: `rb_07` · Pasangan sequence: `sq_07`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengguna | `r07_a1` |
| Aktor | Member Frequent Traveller | `r07_a2` |
| Boundary | Halaman Pemesanan | `r07_b` |
| Control | Memproses Pemesanan | `r07_c1` |
| Control | Memeriksa Duplikat Booking | `r07_c2` |
| Control | Membuat Booking | `r07_c3` |
| Entity | Penerbangan | `r07_e1` |
| Entity | Booking | `r07_e2` |
| Entity | Tiket Pesawat | `r07_e3` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengguna | Halaman Pemesanan | pilih penerbangan & isi data pesanan / lihat data pesanan |
| Member Frequent Traveller | Halaman Pemesanan | pilih penerbangan & isi data pesanan / lihat data pesanan |
| Halaman Pemesanan | Memproses Pemesanan | kirim pesanan / terima data pesanan atau pesan error |
| Memproses Pemesanan | Penerbangan | periksa ketersediaan penerbangan |
| Memproses Pemesanan | Memeriksa Duplikat Booking | periksa duplikat |
| Memeriksa Duplikat Booking | Booking | cari booking yang sama |
| Memproses Pemesanan | Membuat Booking | tidak duplikat, buat booking |
| Membuat Booking | Booking | simpan booking |
| Membuat Booking | Tiket Pesawat | terbitkan tiket |

### Narasi

> Use case: Memesan tiket pesawat (US2-b, US6-c).
> Alur utama: Pengguna/Member memilih penerbangan dan mengisi data pesanan pada Halaman Pemesanan. Memproses Pemesanan memeriksa ketersediaan Penerbangan, Memeriksa Duplikat Booking mencari Booking yang sama, lalu Membuat Booking menyimpan Booking (status awal booked) dan menerbitkan Tiket Pesawat. Halaman menampilkan data pesanan beserta maskapai.
> Alternatif: input tidak valid, penerbangan tidak tersedia, atau booking duplikat; Halaman menampilkan pesan kesalahan.

---

## RB08 — Membatalkan Tiket Pesawat (US2-c)

Diagram: `rb_08` · Pasangan sequence: `sq_08`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengguna | `r08_a` |
| Boundary | Halaman Data Pesanan | `r08_b1` |
| Boundary | Halaman Konfirmasi Pembatalan | `r08_b2` |
| Control | Mengambil Data Pesanan | `r08_c1` |
| Control | Membatalkan Pesanan | `r08_c2` |
| Entity | Booking | `r08_e1` |
| Entity | Tiket Pesawat | `r08_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengguna | Halaman Data Pesanan | buka data pesanan / lihat pesanan tersedia |
| Pengguna | Halaman Konfirmasi Pembatalan | pilih pesanan & konfirmasi / lihat hasil pembatalan |
| Halaman Data Pesanan | Mengambil Data Pesanan | minta data pesanan / terima daftar pesanan |
| Mengambil Data Pesanan | Booking | ambil booking milik pengguna |
| Halaman Konfirmasi Pembatalan | Membatalkan Pesanan | kirim pembatalan / terima hasil atau error |
| Membatalkan Pesanan | Booking | periksa dan ubah status booking menjadi dibatalkan |
| Membatalkan Pesanan | Tiket Pesawat | batalkan tiket |

### Narasi

> Use case: Membatalkan tiket pesawat (US2-c).
> Alur utama: Pengguna membuka Halaman Data Pesanan; Mengambil Data Pesanan membaca Booking milik pengguna. Pengguna memilih pesanan dan mengonfirmasi di Halaman Konfirmasi Pembatalan; Membatalkan Pesanan mengubah status Booking menjadi dibatalkan dan membatalkan Tiket Pesawat.
> Alternatif: pesanan tidak dapat dibatalkan (mis. sudah dibatalkan), Halaman menampilkan pesan kesalahan.

---

## RB09 — Mengupdate Data Profil (US5-a)

Diagram: `rb_09` · Pasangan sequence: `sq_09`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Member Frequent Traveller | `r09_a` |
| Boundary | Halaman Profil | `r09_b` |
| Control | Validasi Input Profil | `r09_c1` |
| Control | Memperbarui Data Profil | `r09_c2` |
| Entity | Profil Member | `r09_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Member Frequent Traveller | Halaman Profil | ubah data profil / lihat profil tersimpan |
| Halaman Profil | Validasi Input Profil | kirim data profil / tampilkan error bila tidak valid |
| Validasi Input Profil | Memperbarui Data Profil | data valid |
| Memperbarui Data Profil | Halaman Profil | kirim konfirmasi profil tersimpan |
| Memperbarui Data Profil | Profil Member | simpan data profil |

### Narasi

> Use case: Mengupdate / melengkapi data profil (US5-a).
> Alur utama: Member Frequent Traveller mengubah data profil pada Halaman Profil. Validasi Input Profil lolos, Memperbarui Data Profil menyimpan ke Profil Member, dan Halaman menampilkan profil yang tersimpan.
> Alternatif: input tidak valid, Halaman menampilkan pesan kesalahan.

---

## RB10 — Melakukan Validasi Tiket (US5-b, US5-c)

Diagram: `rb_10` · Pasangan sequence: `sq_10`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Member Frequent Traveller | `r10_a` |
| Boundary | Halaman Validasi Tiket | `r10_b` |
| Control | Memeriksa Kelengkapan Profil | `r10_c1` |
| Control | Memvalidasi Tiket | `r10_c2` |
| Entity | Profil Member | `r10_e1` |
| Entity | Tiket Pesawat | `r10_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Member Frequent Traveller | Halaman Validasi Tiket | minta validasi tiket / lihat hasil atau pesan |
| Halaman Validasi Tiket | Memeriksa Kelengkapan Profil | kirim permintaan / terima pesan "data profil tidak lengkap" |
| Memeriksa Kelengkapan Profil | Profil Member | ambil data profil |
| Memeriksa Kelengkapan Profil | Memvalidasi Tiket | profil lengkap |
| Memvalidasi Tiket | Tiket Pesawat | tandai tiket tervalidasi |
| Memvalidasi Tiket | Halaman Validasi Tiket | kirim hasil validasi tiket |

### Narasi

> Use case: Melakukan validasi tiket (US5-b, US5-c).
> Alur utama: Member meminta validasi tiket pada Halaman Validasi Tiket. Memeriksa Kelengkapan Profil membaca Profil Member; bila lengkap, Memvalidasi Tiket menandai Tiket Pesawat tervalidasi dan Halaman menampilkan hasilnya.
> Alternatif: profil tidak lengkap, sistem mengirim pesan "data profil tidak lengkap" dan menolak validasi hingga profil dinyatakan lengkap.

---

## RB11 — Melihat Penerbangan Sesuai Preferensi (US6-a)

Diagram: `rb_11` · Pasangan sequence: `sq_11`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Member Frequent Traveller | `r11_a0` |
| Boundary | Halaman Preferensi Penerbangan | `r11_b` |
| Control | Validasi Preferensi | `r11_c1` |
| Control | Mencari Penerbangan Sesuai Preferensi | `r11_c2` |
| Entity | Penerbangan | `r11_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Member Frequent Traveller | Halaman Preferensi Penerbangan | isi tujuan, tanggal, dan jam keberangkatan / lihat hasil pencarian |
| Halaman Preferensi Penerbangan | Validasi Preferensi | kirim tujuan, tanggal, dan jam keberangkatan / tampilkan error bila input tidak valid |
| Validasi Preferensi | Mencari Penerbangan Sesuai Preferensi | input valid |
| Mencari Penerbangan Sesuai Preferensi | Halaman Preferensi Penerbangan | kirim jadwal, maskapai, dan harga tiket |
| Mencari Penerbangan Sesuai Preferensi | Penerbangan | ambil penerbangan sesuai tujuan, tanggal, dan jam keberangkatan |

### Narasi

> Use case: Melihat penerbangan sesuai preferensi (US6-a).
> Alur utama: Member mengisi preferensi tujuan, tanggal, dan jam keberangkatan. Setelah Validasi Preferensi lolos, Mencari Penerbangan Sesuai Preferensi membaca Penerbangan dan Halaman menampilkan data penerbangan yang sesuai.
> Alternatif: preferensi tidak valid, Halaman menampilkan pesan kesalahan.

---

## RB12 — Membandingkan Harga Tiket Penerbangan (US6-b)

Diagram: `rb_12` · Pasangan sequence: `sq_12`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Member Frequent Traveller | `r12_a` |
| Boundary | Halaman Perbandingan Penerbangan | `r12_b` |
| Control | Validasi Preferensi | `r12_c1` |
| Control | Mengambil Penerbangan Sesuai Preferensi | `r12_c2` |
| Control | Membandingkan Harga Tiket | `r12_c3` |
| Entity | Penerbangan | `r12_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Member Frequent Traveller | Halaman Perbandingan Penerbangan | isi preferensi / lihat perbandingan harga |
| Halaman Perbandingan Penerbangan | Validasi Preferensi | kirim preferensi / tampilkan error bila tidak valid |
| Validasi Preferensi | Mengambil Penerbangan Sesuai Preferensi | preferensi valid |
| Mengambil Penerbangan Sesuai Preferensi | Penerbangan | ambil penerbangan sesuai preferensi |
| Mengambil Penerbangan Sesuai Preferensi | Membandingkan Harga Tiket | serahkan daftar penerbangan |
| Membandingkan Harga Tiket | Halaman Perbandingan Penerbangan | kirim data penerbangan terurut menurut harga |

### Narasi

> Use case: Membandingkan harga tiket penerbangan (US6-b).
> Alur utama: Member mengisi preferensi tujuan, tanggal, dan jam keberangkatan. Setelah Validasi Preferensi lolos, Mengambil Penerbangan Sesuai Preferensi membaca Penerbangan, Membandingkan Harga Tiket mengurutkan dan membandingkan harga, lalu Halaman menampilkannya.
> Alternatif: preferensi tidak valid, Halaman menampilkan pesan kesalahan. Dari hasil ini Member dapat lanjut ke use case Memesan Tiket Pesawat (US6-c).

---

## RB13 — Melihat Status Booking (US7)

Diagram: `rb_13` · Pasangan sequence: `sq_13`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Manager Travel | `r13_a` |
| Boundary | Halaman Status Booking | `r13_b` |
| Control | Mengambil Status Booking | `r13_c1` |
| Control | Memfilter Status Booking | `r13_c2` |
| Entity | Booking | `r13_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Manager Travel | Halaman Status Booking | buka status / pilih filter status / lihat hasil |
| Halaman Status Booking | Mengambil Status Booking | minta semua status booking / terima daftar status |
| Halaman Status Booking | Memfilter Status Booking | pilih confirmed, booked, atau waiting for the payment / terima hasil filter |
| Mengambil Status Booking | Booking | ambil semua booking |
| Memfilter Status Booking | Booking | ambil booking sesuai status terpilih |

### Narasi

> Use case: Memeriksa otorisasi travel / Melihat status booking (US7-a/b).
> Alur utama: Manager Travel membuka Halaman Status Booking; Mengambil Status Booking membaca semua Booking dan Halaman menampilkannya.
> Alternatif: Manager Travel memilih status confirmed, booked, atau waiting for the payment; Memfilter Status Booking membaca Booking sesuai status dan Halaman menampilkan hasil filter.

---

## RB14 — Mencari Tiket Penerbangan (US8-a)

Diagram: `rb_14` · Pasangan sequence: `sq_14`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Manager Travel | `r14_a0` |
| Boundary | Halaman Pencarian Tiket | `r14_b` |
| Control | Validasi Input Pencarian | `r14_c1` |
| Control | Mencari Tiket Penerbangan | `r14_c2` |
| Entity | Penerbangan | `r14_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Manager Travel | Halaman Pencarian Tiket | isi tujuan / lihat hasil pencarian |
| Halaman Pencarian Tiket | Validasi Input Pencarian | kirim tujuan / tampilkan error bila input tidak valid |
| Validasi Input Pencarian | Mencari Tiket Penerbangan | input valid |
| Mencari Tiket Penerbangan | Halaman Pencarian Tiket | kirim jadwal, maskapai, dan harga tiket |
| Mencari Tiket Penerbangan | Penerbangan | ambil penerbangan sesuai tujuan |

### Narasi

> Use case: Mencari tiket penerbangan (US8-a).
> Alur utama: Manager Travel mengisi tujuan pada Halaman Pencarian Tiket. Setelah Validasi Input Pencarian lolos, Mencari Tiket Penerbangan membaca Penerbangan dan Halaman menampilkan tiket yang diinginkan.
> Alternatif: input tidak valid, Halaman menampilkan pesan kesalahan.

---

## RB15 — Memesan Tiket Menggunakan Data Pengunjung (US8-b)

Diagram: `rb_15` · Pasangan sequence: `sq_15`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Manager Travel | `r15_a` |
| Boundary | Halaman Pemesanan Pengunjung | `r15_b` |
| Control | Validasi Data Pengunjung | `r15_c1` |
| Control | Membuat Booking Pengunjung | `r15_c2` |
| Entity | Data Pengunjung | `r15_e1` |
| Entity | Booking | `r15_e2` |
| Entity | Tiket Pesawat | `r15_e3` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Manager Travel | Halaman Pemesanan Pengunjung | pilih tiket & isi data pengunjung / lihat konfirmasi |
| Halaman Pemesanan Pengunjung | Validasi Data Pengunjung | kirim data pengunjung / terima konfirmasi atau error |
| Validasi Data Pengunjung | Data Pengunjung | cari dan periksa data pengunjung |
| Validasi Data Pengunjung | Membuat Booking Pengunjung | data lengkap |
| Membuat Booking Pengunjung | Booking | simpan booking atas nama pengunjung |
| Membuat Booking Pengunjung | Tiket Pesawat | terbitkan tiket |

### Narasi

> Use case: Memesan tiket menggunakan data pengunjung (US8-b).
> Alur utama: Manager Travel memilih tiket hasil pencarian dan mengisi data pengunjung pada Halaman Pemesanan Pengunjung. Validasi Data Pengunjung memeriksa Data Pengunjung; bila lengkap, Membuat Booking Pengunjung menyimpan Booking atas nama pengunjung dan menerbitkan Tiket Pesawat, lalu Halaman menampilkan konfirmasi. Pesanan ini memicu use case Menerima e-tiket dan Melihat tiket terpesan.
> Alternatif: data pengunjung tidak lengkap, Halaman menampilkan pesan kesalahan.

---

## RB16 — Mengotorisasi Tiket yang Sudah Dibooking (US9)

Diagram: `rb_16` · Pasangan sequence: `sq_16`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Manager Travel | `r16_a` |
| Boundary | Halaman Otorisasi Tiket | `r16_b` |
| Control | Validasi Kode Booking Reference | `r16_c1` |
| Control | Mengambil Status Booking | `r16_c2` |
| Entity | Booking | `r16_e` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Manager Travel | Halaman Otorisasi Tiket | isi kode booking reference / lihat status atau pesan |
| Halaman Otorisasi Tiket | Validasi Kode Booking Reference | kirim kode / terima pesan "kode booking reference tidak sesuai" |
| Validasi Kode Booking Reference | Booking | cocokkan kode booking reference |
| Validasi Kode Booking Reference | Mengambil Status Booking | kode sesuai |
| Mengambil Status Booking | Booking | ambil status booking |
| Mengambil Status Booking | Halaman Otorisasi Tiket | kirim status booking |

### Narasi

> Use case: Mengotorisasi tiket yang sudah dibooking (US9-a/b).
> Alur utama: Manager Travel mengisi kode booking reference pada Halaman Otorisasi Tiket. Validasi Kode Booking Reference mencocokkannya dengan Booking; bila sesuai, Mengambil Status Booking membaca status dan Halaman menampilkannya.
> Alternatif: kode tidak sesuai, Halaman menampilkan pesan "kode booking reference tidak sesuai" dan meminta Manager Travel mengulang input kode.

---

## RB17 — Melihat Tiket yang Terpesan (US8-c)

Diagram: `rb_17` · Pasangan sequence: `sq_17`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengunjung | `r17_a` |
| Boundary | Halaman Tiket Saya | `r17_b` |
| Control | Mengambil Tiket Pengunjung | `r17_c` |
| Entity | Booking | `r17_e1` |
| Entity | Tiket Pesawat | `r17_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengunjung | Halaman Tiket Saya | buka tiket saya / lihat tiket terpesan |
| Halaman Tiket Saya | Mengambil Tiket Pengunjung | minta tiket / terima daftar tiket |
| Mengambil Tiket Pengunjung | Booking | ambil booking atas nama pengunjung |
| Mengambil Tiket Pengunjung | Tiket Pesawat | ambil tiket dari booking |

### Narasi

> Use case: Melihat tiket yang terpesan (US8-c).
> Alur utama: Pengunjung membuka Halaman Tiket Saya. Mengambil Tiket Pengunjung membaca Booking atas nama pengunjung beserta Tiket Pesawat, lalu Halaman menampilkan tiket yang telah dipesankan Manager Travel.
> Alternatif: belum ada tiket, Halaman menampilkan daftar kosong.

---

## RB18 — Menerima E-Tiket (US8-d)

Diagram: `rb_18` · Pasangan sequence: `sq_18`

### Elemen

| Tipe | Nama | Id |
|---|---|---|
| Aktor | Pengunjung | `r18_a` |
| Boundary | Email E-Tiket | `r18_b` |
| Control | Membuat E-Tiket | `r18_c1` |
| Control | Mengirim E-Tiket | `r18_c2` |
| Entity | Tiket Pesawat | `r18_e1` |
| Entity | Data Pengunjung | `r18_e2` |

### Asosiasi

| Dari | Ke | Label |
|---|---|---|
| Pengunjung | Email E-Tiket | terima e-tiket |
| Email E-Tiket | Mengirim E-Tiket | terima email e-tiket / hasil pengiriman |
| Mengirim E-Tiket | Membuat E-Tiket | minta e-tiket dibuat |
| Membuat E-Tiket | Tiket Pesawat | ambil data tiket |
| Mengirim E-Tiket | Data Pengunjung | ambil email terdaftar |

### Narasi

> Use case: Menerima e-tiket (US8-d).
> Alur utama: setelah booking atas nama pengunjung tersimpan, Mengirim E-Tiket meminta Membuat E-Tiket mengambil data Tiket Pesawat, mengambil email terdaftar dari Data Pengunjung, lalu mengirim e-tiket lewat Email E-Tiket yang diterima Pengunjung.
> Alternatif: email terdaftar tidak tersedia, pengiriman gagal dan dicatat untuk dikirim ulang.
