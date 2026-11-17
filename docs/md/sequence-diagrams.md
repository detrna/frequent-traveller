# Sequence Diagrams (UML) — APS

Sumber: `docs/duma/APS-generated.dfd.json` (diagram `sq_01`…`sq_18`). Setiap sequence berpasangan dengan robustness `rb_NN` (lihat `docs/md/robustness-diagrams.md`); lifeline sequence = objek pada robustness yang sama.

## Konvensi

- Satu diagram = satu skenario use case, memuat jalur sukses dan gagal sebagai fragmen `alt` (`loop`/`opt` bila perlu).
- Notasi pesan di dokumen ini: `->>` = `sync` (panggil dan tunggu), `-)` = `async`, `-->>` = `reply` (balasan ke pengirim `sync` sebelumnya). `A ->> A` = pesan ke diri sendiri.
- Lifeline berawalan `:` (objek anonim); aktor tanpa titik dua. Tipe DUMA: `seq-actor`, `seq-lifeline`, `seq-fragment`.
- Pesan galat dikirim sebagai `async` (bukan `reply`) agar tiap `sync` hanya punya satu balasan walau ada dua fragmen `alt`.
- Id: node `sNN_<kunci>`, fragmen `sNN_fK`, pesan `sNN_mK` (urutan = urutan `edges`).
- Pesan wajib verbatim: "data profil tidak lengkap" (SQ10), "kode booking reference tidak sesuai" (SQ16).

## Daftar Isi

| No. | Skenario | Diagram | Robustness |
|---|---|---|---|
| SQ01 | [Melihat Jadwal Cuti Pegawai](#sq01--melihat-jadwal-cuti-pegawai) | `sq_01` | `rb_01` |
| SQ02 | [Melihat Pengajuan Cuti Pegawai](#sq02--melihat-pengajuan-cuti-pegawai) | `sq_02` | `rb_02` |
| SQ03 | [Melihat Riwayat Cuti Pegawai](#sq03--melihat-riwayat-cuti-pegawai) | `sq_03` | `rb_03` |
| SQ04 | [Melihat Jadwal Penerbangan](#sq04--melihat-jadwal-penerbangan) | `sq_04` | `rb_04` |
| SQ05 | [Mencari Penerbangan Beberapa Tujuan](#sq05--mencari-penerbangan-beberapa-tujuan) | `sq_05` | `rb_05` |
| SQ06 | [Mencari Penerbangan Multi-Destinasi](#sq06--mencari-penerbangan-multi-destinasi) | `sq_06` | `rb_06` |
| SQ07 | [Memesan Tiket Pesawat](#sq07--memesan-tiket-pesawat) | `sq_07` | `rb_07` |
| SQ08 | [Membatalkan Tiket Pesawat](#sq08--membatalkan-tiket-pesawat) | `sq_08` | `rb_08` |
| SQ09 | [Mengupdate Data Profil](#sq09--mengupdate-data-profil) | `sq_09` | `rb_09` |
| SQ10 | [Melakukan Validasi Tiket](#sq10--melakukan-validasi-tiket) | `sq_10` | `rb_10` |
| SQ11 | [Melihat Penerbangan Sesuai Preferensi](#sq11--melihat-penerbangan-sesuai-preferensi) | `sq_11` | `rb_11` |
| SQ12 | [Membandingkan Harga Tiket Penerbangan](#sq12--membandingkan-harga-tiket-penerbangan) | `sq_12` | `rb_12` |
| SQ13 | [Melihat Status Booking](#sq13--melihat-status-booking) | `sq_13` | `rb_13` |
| SQ14 | [Mencari Tiket Penerbangan](#sq14--mencari-tiket-penerbangan) | `sq_14` | `rb_14` |
| SQ15 | [Memesan Tiket Menggunakan Data Pengunjung](#sq15--memesan-tiket-menggunakan-data-pengunjung) | `sq_15` | `rb_15` |
| SQ16 | [Mengotorisasi Tiket yang Sudah Dibooking](#sq16--mengotorisasi-tiket-yang-sudah-dibooking) | `sq_16` | `rb_16` |
| SQ17 | [Melihat Tiket yang Terpesan](#sq17--melihat-tiket-yang-terpesan) | `sq_17` | `rb_17` |
| SQ18 | [Menerima E-Tiket](#sq18--menerima-e-tiket) | `sq_18` | `rb_18` |

---

## SQ01 — Melihat Jadwal Cuti Pegawai

Diagram: `sq_01` · Pasangan robustness: `rb_01`

### Lifeline (kiri ke kanan)

1. `HRD Manager` (aktor)
2. `:Halaman Jadwal Cuti`
3. `:Validasi Periode Cuti`
4. `:Mengambil Jadwal Cuti`
5. `:Permohonan Cuti`
6. `:Pegawai`

### Urutan pesan

```text
 1. HRD Manager ->> :Halaman Jadwal Cuti : pilihPeriode(tanggal, bulan, tahun)
 2. :Halaman Jadwal Cuti ->> :Validasi Periode Cuti : validasiPeriode(tanggal, bulan, tahun)
 3. :Validasi Periode Cuti ->> :Validasi Periode Cuti : periksaPeriode()
alt [periode valid]
   4. :Validasi Periode Cuti ->> :Mengambil Jadwal Cuti : ambilJadwalCuti(periode)
   5. :Mengambil Jadwal Cuti ->> :Permohonan Cuti : cariPermohonan(periode)
   6. :Permohonan Cuti -->> :Mengambil Jadwal Cuti : daftarPermohonan
   7. :Mengambil Jadwal Cuti ->> :Pegawai : ambilDataPegawai(daftarPegawai)
   8. :Pegawai -->> :Mengambil Jadwal Cuti : dataPegawai
   9. :Mengambil Jadwal Cuti -->> :Validasi Periode Cuti : jadwalCuti
  10. :Validasi Periode Cuti -->> :Halaman Jadwal Cuti : jadwalCuti
  11. :Halaman Jadwal Cuti -) HRD Manager : tampilkanPegawaiCuti()
alt [periode tidak valid]
  12. :Validasi Periode Cuti -) :Halaman Jadwal Cuti : kirimPesanError(pesan)
  13. :Halaman Jadwal Cuti -) HRD Manager : tampilkanError(pesan)
```

---

## SQ02 — Melihat Pengajuan Cuti Pegawai

Diagram: `sq_02` · Pasangan robustness: `rb_02`

### Lifeline (kiri ke kanan)

1. `HRD Manager` (aktor)
2. `:Halaman Pengajuan Cuti`
3. `:Validasi Periode Cuti`
4. `:Mengambil Pengajuan Cuti`
5. `:Permohonan Cuti`
6. `:Pegawai`

### Urutan pesan

```text
 1. HRD Manager ->> :Halaman Pengajuan Cuti : pilihPeriode(periode)
 2. :Halaman Pengajuan Cuti ->> :Validasi Periode Cuti : validasiPeriode(periode)
 3. :Validasi Periode Cuti ->> :Validasi Periode Cuti : periksaPeriode()
alt [periode valid]
   4. :Validasi Periode Cuti ->> :Mengambil Pengajuan Cuti : ambilPengajuanCuti(periode)
   5. :Mengambil Pengajuan Cuti ->> :Permohonan Cuti : cariPermohonan(periode)
   6. :Permohonan Cuti -->> :Mengambil Pengajuan Cuti : periodeDanLamaCuti
   7. :Mengambil Pengajuan Cuti ->> :Pegawai : ambilNamaPegawai(daftarPegawai)
   8. :Pegawai -->> :Mengambil Pengajuan Cuti : namaPegawai
   9. :Mengambil Pengajuan Cuti -->> :Validasi Periode Cuti : daftarPengajuan
  10. :Validasi Periode Cuti -->> :Halaman Pengajuan Cuti : daftarPengajuan
  11. :Halaman Pengajuan Cuti -) HRD Manager : tampilkanNamaPeriodeLamaCuti()
alt [periode tidak valid]
  12. :Validasi Periode Cuti -) :Halaman Pengajuan Cuti : kirimPesanError(pesan)
  13. :Halaman Pengajuan Cuti -) HRD Manager : tampilkanError(pesan)
```

---

## SQ03 — Melihat Riwayat Cuti Pegawai

Diagram: `sq_03` · Pasangan robustness: `rb_03`

### Lifeline (kiri ke kanan)

1. `HRD Manager` (aktor)
2. `:Halaman Riwayat Cuti`
3. `:Mengambil Riwayat Cuti`
4. `:Menghitung Sisa Cuti`
5. `:Pegawai`
6. `:Riwayat Cuti`

### Urutan pesan

```text
 1. HRD Manager ->> :Halaman Riwayat Cuti : pilihPegawai(idPegawai)
 2. :Halaman Riwayat Cuti ->> :Mengambil Riwayat Cuti : ambilRiwayatCuti(idPegawai)
 3. :Mengambil Riwayat Cuti ->> :Pegawai : cariPegawai(idPegawai)
 4. :Pegawai -->> :Mengambil Riwayat Cuti : dataPegawai
alt [pegawai ditemukan]
   5. :Mengambil Riwayat Cuti ->> :Riwayat Cuti : ambilRiwayat(idPegawai)
   6. :Riwayat Cuti -->> :Mengambil Riwayat Cuti : riwayatCuti
   7. :Mengambil Riwayat Cuti ->> :Menghitung Sisa Cuti : hitungSisaCuti(riwayatCuti, tahunBerjalan)
   8. :Menghitung Sisa Cuti -->> :Mengambil Riwayat Cuti : sisaCuti
   9. :Mengambil Riwayat Cuti -->> :Halaman Riwayat Cuti : riwayatDanSisaCuti
  10. :Halaman Riwayat Cuti -) HRD Manager : tampilkanRiwayatDanSisaCuti()
alt [pegawai tidak ditemukan]
  11. :Mengambil Riwayat Cuti -) :Halaman Riwayat Cuti : kirimPesanError(pesan)
  12. :Halaman Riwayat Cuti -) HRD Manager : tampilkanError(pesan)
```

---

## SQ04 — Melihat Jadwal Penerbangan

Diagram: `sq_04` · Pasangan robustness: `rb_04`

### Lifeline (kiri ke kanan)

1. `Pengguna` (aktor)
2. `:Halaman Pencarian Penerbangan`
3. `:Validasi Input Pencarian`
4. `:Mencari Penerbangan`
5. `:Penerbangan`

### Urutan pesan

```text
 1. Pengguna ->> :Halaman Pencarian Penerbangan : isiPencarian(tujuan, tanggal)
 2. :Halaman Pencarian Penerbangan ->> :Validasi Input Pencarian : validasiInput(tujuan, tanggal)
 3. :Validasi Input Pencarian ->> :Validasi Input Pencarian : periksaKelengkapanInput()
alt [input valid]
   4. :Validasi Input Pencarian ->> :Mencari Penerbangan : cariPenerbangan(tujuan, tanggal)
   5. :Mencari Penerbangan ->> :Penerbangan : ambilPenerbangan(tujuan, tanggal)
   6. :Penerbangan -->> :Mencari Penerbangan : daftarPenerbangan
   7. :Mencari Penerbangan -->> :Validasi Input Pencarian : daftarPenerbangan
   8. :Validasi Input Pencarian -->> :Halaman Pencarian Penerbangan : daftarPenerbangan
   9. :Halaman Pencarian Penerbangan -) Pengguna : tampilkanJadwalMaskapaiHarga()
alt [input tidak valid]
  10. :Validasi Input Pencarian -) :Halaman Pencarian Penerbangan : kirimPesanError(pesan)
  11. :Halaman Pencarian Penerbangan -) Pengguna : tampilkanError(pesan)
```

---

## SQ05 — Mencari Penerbangan Beberapa Tujuan

Diagram: `sq_05` · Pasangan robustness: `rb_05`

### Lifeline (kiri ke kanan)

1. `Pengguna` (aktor)
2. `:Halaman Pencarian Multi Tujuan`
3. `:Validasi Daftar Tujuan`
4. `:Mencari Penerbangan per Tujuan`
5. `:Menggabungkan Hasil Pencarian`
6. `:Penerbangan`

### Urutan pesan

```text
 1. Pengguna ->> :Halaman Pencarian Multi Tujuan : isiDaftarTujuan(daftarTujuan, tanggal)
 2. :Halaman Pencarian Multi Tujuan ->> :Validasi Daftar Tujuan : validasiDaftarTujuan(daftarTujuan)
 3. :Validasi Daftar Tujuan ->> :Validasi Daftar Tujuan : periksaDaftarTujuan()
alt [daftar tujuan valid]
   4. :Validasi Daftar Tujuan ->> :Mencari Penerbangan per Tujuan : cariPenerbangan(daftarTujuan, tanggal)
  loop [tiap tujuan]
     5. :Mencari Penerbangan per Tujuan ->> :Penerbangan : ambilPenerbangan(tujuan, tanggal)
     6. :Penerbangan -->> :Mencari Penerbangan per Tujuan : penerbanganTujuan
   7. :Mencari Penerbangan per Tujuan ->> :Menggabungkan Hasil Pencarian : gabungkanHasil(hasilPerTujuan)
   8. :Menggabungkan Hasil Pencarian -->> :Mencari Penerbangan per Tujuan : daftarGabungan
   9. :Mencari Penerbangan per Tujuan -->> :Validasi Daftar Tujuan : daftarGabungan
  10. :Validasi Daftar Tujuan -->> :Halaman Pencarian Multi Tujuan : daftarGabungan
  11. :Halaman Pencarian Multi Tujuan -) Pengguna : tampilkanJadwalMaskapaiHarga()
alt [daftar tujuan tidak valid]
  12. :Validasi Daftar Tujuan -) :Halaman Pencarian Multi Tujuan : kirimPesanError(pesan)
  13. :Halaman Pencarian Multi Tujuan -) Pengguna : tampilkanError(pesan)
```

---

## SQ06 — Mencari Penerbangan Multi-Destinasi

Diagram: `sq_06` · Pasangan robustness: `rb_06`

### Lifeline (kiri ke kanan)

1. `Member Frequent Traveller` (aktor)
2. `:Halaman Pencarian Multi-Destinasi`
3. `:Validasi Kriteria Pencarian`
4. `:Mencari Penerbangan Multi-Destinasi`
5. `:Menghitung Total Harga`
6. `:Penerbangan`

### Urutan pesan

```text
 1. Member Frequent Traveller ->> :Halaman Pencarian Multi-Destinasi : isiKriteria(tanggal, lokasiKeberangkatan, daftarTujuan)
 2. :Halaman Pencarian Multi-Destinasi ->> :Validasi Kriteria Pencarian : validasiKriteria(tanggal, lokasiKeberangkatan, daftarTujuan)
 3. :Validasi Kriteria Pencarian ->> :Validasi Kriteria Pencarian : periksaKriteria()
alt [kriteria valid]
   4. :Validasi Kriteria Pencarian ->> :Mencari Penerbangan Multi-Destinasi : cariMultiDestinasi(tanggal, lokasiKeberangkatan, daftarTujuan)
  loop [tiap rute]
     5. :Mencari Penerbangan Multi-Destinasi ->> :Penerbangan : ambilPenerbangan(asal, tujuan, tanggal)
     6. :Penerbangan -->> :Mencari Penerbangan Multi-Destinasi : penerbanganRute
   7. :Mencari Penerbangan Multi-Destinasi ->> :Menghitung Total Harga : hitungTotal(daftarRute)
   8. :Menghitung Total Harga -->> :Mencari Penerbangan Multi-Destinasi : totalHargaDanJumlah
   9. :Mencari Penerbangan Multi-Destinasi -->> :Validasi Kriteria Pencarian : hasilMultiDestinasi
  10. :Validasi Kriteria Pencarian -->> :Halaman Pencarian Multi-Destinasi : hasilMultiDestinasi
  11. :Halaman Pencarian Multi-Destinasi -) Member Frequent Traveller : tampilkanJadwalHargaMultiDestinasi()
alt [kriteria tidak valid]
  12. :Validasi Kriteria Pencarian -) :Halaman Pencarian Multi-Destinasi : kirimPesanError(pesan)
  13. :Halaman Pencarian Multi-Destinasi -) Member Frequent Traveller : tampilkanError(pesan)
```

---

## SQ07 — Memesan Tiket Pesawat

Diagram: `sq_07` · Pasangan robustness: `rb_07`

### Lifeline (kiri ke kanan)

1. `Pengguna` (aktor)
2. `:Halaman Pemesanan`
3. `:Memproses Pemesanan`
4. `:Memeriksa Duplikat Booking`
5. `:Membuat Booking`
6. `:Penerbangan`
7. `:Booking`
8. `:Tiket Pesawat`

### Urutan pesan

```text
 1. Pengguna ->> :Halaman Pemesanan : pilihPenerbangan(idPenerbangan, dataPesanan)
 2. :Halaman Pemesanan ->> :Memproses Pemesanan : prosesPemesanan(idPenerbangan, dataPesanan)
 3. :Memproses Pemesanan ->> :Memproses Pemesanan : validasiInput()
 4. :Memproses Pemesanan ->> :Penerbangan : periksaKetersediaan(idPenerbangan)
 5. :Penerbangan -->> :Memproses Pemesanan : statusKetersediaan
 6. :Memproses Pemesanan ->> :Memeriksa Duplikat Booking : periksaDuplikat(idPengguna, idPenerbangan)
 7. :Memeriksa Duplikat Booking ->> :Booking : cariBooking(idPengguna, idPenerbangan)
 8. :Booking -->> :Memeriksa Duplikat Booking : hasilPencarian
 9. :Memeriksa Duplikat Booking -->> :Memproses Pemesanan : hasilPemeriksaan
alt [input valid, tersedia, tidak duplikat]
  10. :Memproses Pemesanan ->> :Membuat Booking : buatBooking(dataPesanan)
  11. :Membuat Booking ->> :Booking : simpanBooking(dataPesanan)
  12. :Booking -->> :Membuat Booking : booking
  13. :Membuat Booking ->> :Tiket Pesawat : terbitkanTiket(booking)
  14. :Tiket Pesawat -->> :Membuat Booking : tiket
  15. :Membuat Booking -->> :Memproses Pemesanan : booking
  16. :Memproses Pemesanan -->> :Halaman Pemesanan : dataPesanan
  17. :Halaman Pemesanan -) Pengguna : tampilkanDataPesananDanMaskapai()
alt [input tidak valid, penuh, atau duplikat]
  18. :Memproses Pemesanan -) :Halaman Pemesanan : kirimPesanError(pesan)
  19. :Halaman Pemesanan -) Pengguna : tampilkanError(pesan)
```

---

## SQ08 — Membatalkan Tiket Pesawat

Diagram: `sq_08` · Pasangan robustness: `rb_08`

### Lifeline (kiri ke kanan)

1. `Pengguna` (aktor)
2. `:Halaman Data Pesanan`
3. `:Halaman Konfirmasi Pembatalan`
4. `:Mengambil Data Pesanan`
5. `:Membatalkan Pesanan`
6. `:Booking`
7. `:Tiket Pesawat`

### Urutan pesan

```text
 1. Pengguna ->> :Halaman Data Pesanan : bukaDataPesanan()
 2. :Halaman Data Pesanan ->> :Mengambil Data Pesanan : ambilDataPesanan(idPengguna)
 3. :Mengambil Data Pesanan ->> :Booking : cariBookingPengguna(idPengguna)
 4. :Booking -->> :Mengambil Data Pesanan : daftarBooking
 5. :Mengambil Data Pesanan -->> :Halaman Data Pesanan : daftarPesanan
 6. :Halaman Data Pesanan -) Pengguna : tampilkanDataPesanan()
 7. Pengguna ->> :Halaman Konfirmasi Pembatalan : konfirmasiPembatalan(idBooking)
 8. :Halaman Konfirmasi Pembatalan ->> :Membatalkan Pesanan : batalkanPesanan(idBooking)
 9. :Membatalkan Pesanan ->> :Booking : periksaStatus(idBooking)
10. :Booking -->> :Membatalkan Pesanan : statusBooking
alt [pesanan dapat dibatalkan]
  11. :Membatalkan Pesanan ->> :Booking : ubahStatus(idBooking, dibatalkan)
  12. :Booking -->> :Membatalkan Pesanan : statusDiubah
  13. :Membatalkan Pesanan ->> :Tiket Pesawat : batalkanTiket(idBooking)
  14. :Tiket Pesawat -->> :Membatalkan Pesanan : tiketDibatalkan
  15. :Membatalkan Pesanan -->> :Halaman Konfirmasi Pembatalan : hasilPembatalan
  16. :Halaman Konfirmasi Pembatalan -) Pengguna : tampilkanPesananDibatalkan()
alt [pesanan tidak dapat dibatalkan]
  17. :Membatalkan Pesanan -) :Halaman Konfirmasi Pembatalan : kirimPesanError(pesan)
  18. :Halaman Konfirmasi Pembatalan -) Pengguna : tampilkanError(pesan)
```

---

## SQ09 — Mengupdate Data Profil

Diagram: `sq_09` · Pasangan robustness: `rb_09`

### Lifeline (kiri ke kanan)

1. `Member Frequent Traveller` (aktor)
2. `:Halaman Profil`
3. `:Validasi Input Profil`
4. `:Memperbarui Data Profil`
5. `:Profil Member`

### Urutan pesan

```text
 1. Member Frequent Traveller ->> :Halaman Profil : isiDataProfil(dataProfil)
 2. :Halaman Profil ->> :Validasi Input Profil : validasiProfil(dataProfil)
 3. :Validasi Input Profil ->> :Validasi Input Profil : periksaFormat()
alt [data valid]
   4. :Validasi Input Profil ->> :Memperbarui Data Profil : simpanProfil(dataProfil)
   5. :Memperbarui Data Profil ->> :Profil Member : perbaruiProfil(idMember, dataProfil)
   6. :Profil Member -->> :Memperbarui Data Profil : profilTersimpan
   7. :Memperbarui Data Profil -->> :Validasi Input Profil : profilTersimpan
   8. :Validasi Input Profil -->> :Halaman Profil : profilTersimpan
   9. :Halaman Profil -) Member Frequent Traveller : tampilkanProfilTersimpan()
alt [data tidak valid]
  10. :Validasi Input Profil -) :Halaman Profil : kirimPesanError(pesan)
  11. :Halaman Profil -) Member Frequent Traveller : tampilkanError(pesan)
```

---

## SQ10 — Melakukan Validasi Tiket

Diagram: `sq_10` · Pasangan robustness: `rb_10`

### Lifeline (kiri ke kanan)

1. `Member Frequent Traveller` (aktor)
2. `:Halaman Validasi Tiket`
3. `:Memeriksa Kelengkapan Profil`
4. `:Memvalidasi Tiket`
5. `:Profil Member`
6. `:Tiket Pesawat`

### Urutan pesan

```text
 1. Member Frequent Traveller ->> :Halaman Validasi Tiket : mintaValidasiTiket(idTiket)
 2. :Halaman Validasi Tiket ->> :Memeriksa Kelengkapan Profil : periksaProfil(idMember)
 3. :Memeriksa Kelengkapan Profil ->> :Profil Member : ambilProfil(idMember)
 4. :Profil Member -->> :Memeriksa Kelengkapan Profil : dataProfil
 5. :Memeriksa Kelengkapan Profil ->> :Memeriksa Kelengkapan Profil : periksaKelengkapan(dataProfil)
alt [data profil lengkap]
   6. :Memeriksa Kelengkapan Profil ->> :Memvalidasi Tiket : validasiTiket(idTiket, dataProfil)
   7. :Memvalidasi Tiket ->> :Tiket Pesawat : tandaiTervalidasi(idTiket)
   8. :Tiket Pesawat -->> :Memvalidasi Tiket : tiketTervalidasi
   9. :Memvalidasi Tiket -->> :Memeriksa Kelengkapan Profil : hasilValidasi
  10. :Memeriksa Kelengkapan Profil -->> :Halaman Validasi Tiket : hasilValidasi
  11. :Halaman Validasi Tiket -) Member Frequent Traveller : tampilkanTiketTervalidasi()
alt [data profil tidak lengkap]
  12. :Memeriksa Kelengkapan Profil -) :Halaman Validasi Tiket : tolakValidasi("data profil tidak lengkap")
  13. :Halaman Validasi Tiket -) Member Frequent Traveller : tampilkanPesan("data profil tidak lengkap")
```

---

## SQ11 — Melihat Penerbangan Sesuai Preferensi

Diagram: `sq_11` · Pasangan robustness: `rb_11`

### Lifeline (kiri ke kanan)

1. `Member Frequent Traveller` (aktor)
2. `:Halaman Preferensi Penerbangan`
3. `:Validasi Preferensi`
4. `:Mencari Penerbangan Sesuai Preferensi`
5. `:Penerbangan`

### Urutan pesan

```text
 1. Member Frequent Traveller ->> :Halaman Preferensi Penerbangan : isiPencarian(tujuan, tanggal, jamKeberangkatan)
 2. :Halaman Preferensi Penerbangan ->> :Validasi Preferensi : validasiInput(tujuan, tanggal, jamKeberangkatan)
 3. :Validasi Preferensi ->> :Validasi Preferensi : periksaKelengkapanInput()
alt [input valid]
   4. :Validasi Preferensi ->> :Mencari Penerbangan Sesuai Preferensi : cariPenerbangan(tujuan, tanggal, jamKeberangkatan)
   5. :Mencari Penerbangan Sesuai Preferensi ->> :Penerbangan : ambilPenerbangan(tujuan, tanggal, jamKeberangkatan)
   6. :Penerbangan -->> :Mencari Penerbangan Sesuai Preferensi : daftarPenerbangan
   7. :Mencari Penerbangan Sesuai Preferensi -->> :Validasi Preferensi : daftarPenerbangan
   8. :Validasi Preferensi -->> :Halaman Preferensi Penerbangan : daftarPenerbangan
   9. :Halaman Preferensi Penerbangan -) Member Frequent Traveller : tampilkanPenerbanganSesuaiPreferensi()
alt [input tidak valid]
  10. :Validasi Preferensi -) :Halaman Preferensi Penerbangan : kirimPesanError(pesan)
  11. :Halaman Preferensi Penerbangan -) Member Frequent Traveller : tampilkanError(pesan)
```

---

## SQ12 — Membandingkan Harga Tiket Penerbangan

Diagram: `sq_12` · Pasangan robustness: `rb_12`

### Lifeline (kiri ke kanan)

1. `Member Frequent Traveller` (aktor)
2. `:Halaman Perbandingan Penerbangan`
3. `:Validasi Preferensi`
4. `:Mengambil Penerbangan Sesuai Preferensi`
5. `:Membandingkan Harga Tiket`
6. `:Penerbangan`

### Urutan pesan

```text
 1. Member Frequent Traveller ->> :Halaman Perbandingan Penerbangan : isiPreferensi(tujuan, tanggal, jamKeberangkatan)
 2. :Halaman Perbandingan Penerbangan ->> :Validasi Preferensi : validasiPreferensi(tujuan, tanggal, jamKeberangkatan)
 3. :Validasi Preferensi ->> :Validasi Preferensi : periksaPreferensi()
alt [preferensi valid]
   4. :Validasi Preferensi ->> :Mengambil Penerbangan Sesuai Preferensi : ambilPenerbangan(tujuan, tanggal, jamKeberangkatan)
   5. :Mengambil Penerbangan Sesuai Preferensi ->> :Penerbangan : cariPenerbangan(tujuan, tanggal, jamKeberangkatan)
   6. :Penerbangan -->> :Mengambil Penerbangan Sesuai Preferensi : daftarPenerbangan
   7. :Mengambil Penerbangan Sesuai Preferensi ->> :Membandingkan Harga Tiket : bandingkanHarga(daftarPenerbangan)
   8. :Membandingkan Harga Tiket -->> :Mengambil Penerbangan Sesuai Preferensi : daftarTerurutHarga
   9. :Mengambil Penerbangan Sesuai Preferensi -->> :Validasi Preferensi : daftarTerurutHarga
  10. :Validasi Preferensi -->> :Halaman Perbandingan Penerbangan : daftarTerurutHarga
  11. :Halaman Perbandingan Penerbangan -) Member Frequent Traveller : tampilkanPerbandinganHarga()
alt [preferensi tidak valid]
  12. :Validasi Preferensi -) :Halaman Perbandingan Penerbangan : kirimPesanError(pesan)
  13. :Halaman Perbandingan Penerbangan -) Member Frequent Traveller : tampilkanError(pesan)
```

---

## SQ13 — Melihat Status Booking

Diagram: `sq_13` · Pasangan robustness: `rb_13`

### Lifeline (kiri ke kanan)

1. `Manager Travel` (aktor)
2. `:Halaman Status Booking`
3. `:Mengambil Status Booking`
4. `:Memfilter Status Booking`
5. `:Booking`

### Urutan pesan

```text
 1. Manager Travel ->> :Halaman Status Booking : bukaStatusBooking()
 2. :Halaman Status Booking ->> :Mengambil Status Booking : ambilSemuaStatus()
 3. :Mengambil Status Booking ->> :Booking : ambilSemuaBooking()
 4. :Booking -->> :Mengambil Status Booking : daftarBooking
 5. :Mengambil Status Booking -->> :Halaman Status Booking : daftarStatusBooking
 6. :Halaman Status Booking -) Manager Travel : tampilkanSemuaStatusBooking()
opt [manajer memilih filter status]
   7. Manager Travel ->> :Halaman Status Booking : pilihStatus(status)
   8. :Halaman Status Booking ->> :Memfilter Status Booking : filterStatus(status)
   9. :Memfilter Status Booking ->> :Booking : ambilBookingByStatus(status)
  10. :Booking -->> :Memfilter Status Booking : daftarBooking
  11. :Memfilter Status Booking -->> :Halaman Status Booking : daftarSesuaiStatus
  12. :Halaman Status Booking -) Manager Travel : tampilkanStatusSesuaiFilter()
```

---

## SQ14 — Mencari Tiket Penerbangan

Diagram: `sq_14` · Pasangan robustness: `rb_14`

### Lifeline (kiri ke kanan)

1. `Manager Travel` (aktor)
2. `:Halaman Pencarian Tiket`
3. `:Validasi Input Pencarian`
4. `:Mencari Tiket Penerbangan`
5. `:Penerbangan`

### Urutan pesan

```text
 1. Manager Travel ->> :Halaman Pencarian Tiket : isiPencarian(tujuan, tanggal)
 2. :Halaman Pencarian Tiket ->> :Validasi Input Pencarian : validasiInput(tujuan, tanggal)
 3. :Validasi Input Pencarian ->> :Validasi Input Pencarian : periksaKelengkapanInput()
alt [input valid]
   4. :Validasi Input Pencarian ->> :Mencari Tiket Penerbangan : cariPenerbangan(tujuan, tanggal)
   5. :Mencari Tiket Penerbangan ->> :Penerbangan : ambilPenerbangan(tujuan, tanggal)
   6. :Penerbangan -->> :Mencari Tiket Penerbangan : daftarPenerbangan
   7. :Mencari Tiket Penerbangan -->> :Validasi Input Pencarian : daftarPenerbangan
   8. :Validasi Input Pencarian -->> :Halaman Pencarian Tiket : daftarPenerbangan
   9. :Halaman Pencarian Tiket -) Manager Travel : tampilkanTiketPenerbangan()
alt [input tidak valid]
  10. :Validasi Input Pencarian -) :Halaman Pencarian Tiket : kirimPesanError(pesan)
  11. :Halaman Pencarian Tiket -) Manager Travel : tampilkanError(pesan)
```

---

## SQ15 — Memesan Tiket Menggunakan Data Pengunjung

Diagram: `sq_15` · Pasangan robustness: `rb_15`

### Lifeline (kiri ke kanan)

1. `Manager Travel` (aktor)
2. `:Halaman Pemesanan Pengunjung`
3. `:Validasi Data Pengunjung`
4. `:Membuat Booking Pengunjung`
5. `:Data Pengunjung`
6. `:Booking`
7. `:Tiket Pesawat`

### Urutan pesan

```text
 1. Manager Travel ->> :Halaman Pemesanan Pengunjung : isiDataPengunjung(idPenerbangan, dataPengunjung)
 2. :Halaman Pemesanan Pengunjung ->> :Validasi Data Pengunjung : validasiDataPengunjung(idPenerbangan, dataPengunjung)
 3. :Validasi Data Pengunjung ->> :Data Pengunjung : cariPengunjung(dataPengunjung)
 4. :Data Pengunjung -->> :Validasi Data Pengunjung : dataPengunjung
 5. :Validasi Data Pengunjung ->> :Validasi Data Pengunjung : periksaKelengkapan(dataPengunjung)
alt [data pengunjung lengkap]
   6. :Validasi Data Pengunjung ->> :Membuat Booking Pengunjung : buatBooking(idPenerbangan, idPengunjung)
   7. :Membuat Booking Pengunjung ->> :Booking : simpanBooking(idPenerbangan, idPengunjung)
   8. :Booking -->> :Membuat Booking Pengunjung : booking
   9. :Membuat Booking Pengunjung ->> :Tiket Pesawat : terbitkanTiket(booking)
  10. :Tiket Pesawat -->> :Membuat Booking Pengunjung : tiket
  11. :Membuat Booking Pengunjung -->> :Validasi Data Pengunjung : booking
  12. :Validasi Data Pengunjung -->> :Halaman Pemesanan Pengunjung : booking
  13. :Halaman Pemesanan Pengunjung -) Manager Travel : tampilkanKonfirmasiPesanan()
alt [data pengunjung tidak lengkap]
  14. :Validasi Data Pengunjung -) :Halaman Pemesanan Pengunjung : kirimPesanError(pesan)
  15. :Halaman Pemesanan Pengunjung -) Manager Travel : tampilkanError(pesan)
```

---

## SQ16 — Mengotorisasi Tiket yang Sudah Dibooking

Diagram: `sq_16` · Pasangan robustness: `rb_16`

### Lifeline (kiri ke kanan)

1. `Manager Travel` (aktor)
2. `:Halaman Otorisasi Tiket`
3. `:Validasi Kode Booking Reference`
4. `:Mengambil Status Booking`
5. `:Booking`

### Urutan pesan

```text
 1. Manager Travel ->> :Halaman Otorisasi Tiket : isiKodeBooking(kodeBookingReference)
 2. :Halaman Otorisasi Tiket ->> :Validasi Kode Booking Reference : validasiKode(kodeBookingReference)
 3. :Validasi Kode Booking Reference ->> :Booking : cariBooking(kodeBookingReference)
 4. :Booking -->> :Validasi Kode Booking Reference : hasilPencarian
alt [kode sesuai]
   5. :Validasi Kode Booking Reference ->> :Mengambil Status Booking : ambilStatusBooking(kodeBookingReference)
   6. :Mengambil Status Booking ->> :Booking : bacaStatus(kodeBookingReference)
   7. :Booking -->> :Mengambil Status Booking : statusBooking
   8. :Mengambil Status Booking -->> :Validasi Kode Booking Reference : statusBooking
   9. :Validasi Kode Booking Reference -->> :Halaman Otorisasi Tiket : statusBooking
  10. :Halaman Otorisasi Tiket -) Manager Travel : tampilkanStatusBooking()
alt [kode tidak sesuai]
  11. :Validasi Kode Booking Reference -) :Halaman Otorisasi Tiket : kirimPesan("kode booking reference tidak sesuai")
  12. :Halaman Otorisasi Tiket -) Manager Travel : tampilkanPesan("kode booking reference tidak sesuai")
  13. :Halaman Otorisasi Tiket -) Manager Travel : mintaInputUlangKode()
```

---

## SQ17 — Melihat Tiket yang Terpesan

Diagram: `sq_17` · Pasangan robustness: `rb_17`

### Lifeline (kiri ke kanan)

1. `Pengunjung` (aktor)
2. `:Halaman Tiket Saya`
3. `:Mengambil Tiket Pengunjung`
4. `:Booking`
5. `:Tiket Pesawat`

### Urutan pesan

```text
 1. Pengunjung ->> :Halaman Tiket Saya : bukaTiketSaya()
 2. :Halaman Tiket Saya ->> :Mengambil Tiket Pengunjung : ambilTiketPengunjung(idPengunjung)
 3. :Mengambil Tiket Pengunjung ->> :Booking : cariBooking(idPengunjung)
 4. :Booking -->> :Mengambil Tiket Pengunjung : daftarBooking
 5. :Mengambil Tiket Pengunjung ->> :Tiket Pesawat : ambilTiket(daftarBooking)
 6. :Tiket Pesawat -->> :Mengambil Tiket Pengunjung : daftarTiket
 7. :Mengambil Tiket Pengunjung -->> :Halaman Tiket Saya : daftarTiket
 8. :Halaman Tiket Saya -) Pengunjung : tampilkanTiketTerpesan()
```

---

## SQ18 — Menerima E-Tiket

Diagram: `sq_18` · Pasangan robustness: `rb_18`

### Lifeline (kiri ke kanan)

1. `Pengunjung` (aktor)
2. `:Email E-Tiket`
3. `:Membuat E-Tiket`
4. `:Mengirim E-Tiket`
5. `:Tiket Pesawat`
6. `:Data Pengunjung`

### Urutan pesan

```text
 1. :Mengirim E-Tiket ->> :Membuat E-Tiket : buatEtiket(idBooking)
 2. :Membuat E-Tiket ->> :Tiket Pesawat : ambilDataTiket(idBooking)
 3. :Tiket Pesawat -->> :Membuat E-Tiket : dataTiket
 4. :Membuat E-Tiket -->> :Mengirim E-Tiket : etiket
 5. :Mengirim E-Tiket ->> :Data Pengunjung : ambilEmailTerdaftar(idPengunjung)
 6. :Data Pengunjung -->> :Mengirim E-Tiket : email
 7. :Mengirim E-Tiket ->> :Email E-Tiket : kirimEmail(etiket, email)
 8. :Email E-Tiket -) Pengunjung : terimaEtiket()
 9. :Email E-Tiket -->> :Mengirim E-Tiket : statusPengiriman
```
