# Peta Implementasi — APS

Pemetaan *user story → use case (robustness/sequence) → halaman → service → tes*. Alur keterlacakan proyek:
user story → use case → robustness → sequence → model domain → **kode**. Jika sebuah story atau diagram berubah, perbarui baris yang sesuai di sini.

Konvensi: boundary → halaman di `src/app`, control → fungsi di `src/server/services`, entity → model di `prisma/schema.prisma`.
Perintah dan pengaturan ada di [`README.md`](../../README.md).

## Peta per story

| Story | Use case (RB/SQ) | Rute | Service (control) | Tes utama |
|---|---|---|---|---|
| **US1-a** jadwal cuti | RB01/SQ01 | `/hrd/jadwal-cuti` | `cuti.ambilJadwalCuti` (+ `validasiPeriode`) | `integration/cuti`, `unit/cuti`, `e2e/cuti` |
| **US1-b** pengajuan cuti | RB02/SQ02 | `/hrd/pengajuan` | `cuti.ambilPengajuanCuti` | idem |
| **US1-c** riwayat & sisa cuti | RB03/SQ03 | `/hrd/riwayat` | `cuti.ambilRiwayatCuti`, `lib/cuti.hitungSisaCuti` | idem |
| **US2-a** jadwal penerbangan | RB04/SQ04 | `/penerbangan/cari` | `penerbangan.cariPenerbangan` | `integration/penerbangan`, `e2e/penerbangan` |
| **US2-b** memesan tiket | RB07/SQ07 | `/pesanan/baru` → `/pesanan/[id]` | `booking.prosesPemesanan` → `buatBookingDiTransaksi` | `integration/booking`, `e2e/pesanan` |
| **US2-c** membatalkan tiket | RB08/SQ08 | `/pesanan`, `/pesanan/[id]/batal` | `booking.ambilDataPesanan`, `batalkanPesanan` | idem |
| **US3** beberapa tujuan | RB05/SQ05 | `/penerbangan/multi-tujuan` | `penerbangan.cariBeberapaTujuan` | `integration/penerbangan`, `e2e/penerbangan` |
| **US4** multi-destinasi | RB06/SQ06 | `/member/multi-destinasi` | `penerbangan.cariMultiDestinasi`, `ringkasMultiDestinasi` | idem |
| **US5-a** update profil | RB09/SQ09 | `/member/profil` | `profil.perbaruiProfil` | `integration/profil-tiket`, `e2e/profil-validasi` |
| **US5-b/c** validasi tiket | RB10/SQ10 | `/member/validasi` | `tiket.validasiTiket` (menolak: `data profil tidak lengkap`) | idem |
| **US6-a** sesuai preferensi | RB11/SQ11 | `/member/preferensi` | `penerbangan.cariSesuaiPreferensi` | `integration/penerbangan`, `e2e/penerbangan` |
| **US6-b** bandingkan harga | RB12/SQ12 | `/member/bandingkan` | `penerbangan.bandingkanHarga`, `susunPerbandingan` | idem |
| **US6-c** memesan | RB07/SQ07 | `/pesanan/baru` (tombol *Pesan* di tiap hasil) | `booking.prosesPemesanan` | `e2e/pesanan` |
| **US7** status booking + filter | RB13/SQ13 | `/travel/status?status=` | `travel.ambilStatusBooking` | `integration/travel`, `e2e/travel` |
| **US8-a** cari tiket | RB14/SQ14 | `/travel/cari` | `penerbangan.cariPenerbangan` | `e2e/travel` |
| **US8-b** pesan untuk pengunjung | RB15/SQ15 | `/travel/pesan` | `travel.pesanUntukPengunjung` | `integration/travel`, `e2e/travel` |
| **US8-c** tiket terpesan | RB17/SQ17 | `/pengunjung/tiket` | `tiket.ambilTiketMilik` | idem |
| **US8-d** e-tiket | RB18/SQ18 | email; kirim ulang di `/travel/booking/[id]` | `etiket.kirimEtiket`, `travel.kirimUlangEtiket` | `integration/travel`, `e2e/travel` (Mailpit API) |
| **US9** otorisasi kode booking | RB16/SQ16 | `/travel/otorisasi?kode=` | `travel.otorisasiKodeBooking` (menolak: `kode booking reference tidak sesuai`) | idem |

Pesan wajib (verbatim, ada konstanta dan tes): `data profil tidak lengkap` — `PESAN_PROFIL_TIDAK_LENGKAP` di `services/tiket.ts`;
`kode booking reference tidak sesuai` — `PESAN_KODE_TIDAK_SESUAI` di `services/travel.ts`.

## Peta entity → model

| Entity (class/robustness) | Model Prisma | Catatan |
|---|---|---|
| User, HRD Manager, Pengguna, Member Frequent Traveller, Manager Travel, Pengunjung (akun) | `User` + enum `Role` | satu tabel, perbedaan peran lewat `role` |
| Profil Member | `ProfilMember` | 1:1 dengan `User` |
| Data Pengunjung (kelas Pengunjung) | `Pengunjung` | 1:1 dengan `User` berperan `PENGUNJUNG` |
| Penerbangan | `Penerbangan`, `Bandara`, `Maskapai` | |
| Booking | `Booking` | `pemilikId` (yang melihat/membatalkan), `dibuatOlehId`, `pengunjungId?` |
| Tiket Pesawat | `TiketPesawat` | `status`: terbit → tervalidasi / dibatalkan |
| (e-tiket) | `NotifikasiEmail` | catatan pengiriman; `GAGAL` dapat dikirim ulang |
| Pegawai, Permohonan Cuti, Riwayat Cuti | `Pegawai`, `PermohonanCuti`, `RiwayatCuti` | |

## Hak akses

| Peran | Kemampuan (`can`) | Awalan rute |
|---|---|---|
| HRD Manager | `cuti.lihat` | `/hrd` |
| Pengguna | `penerbangan.cari`, `booking.kelola`, `tiket.lihatMilik` | `/penerbangan`, `/pesanan` |
| Member Frequent Traveller | Pengguna + `member.fitur` | + `/member` |
| Manager Travel | `travel.kelola` | `/travel` |
| Pengunjung | `tiket.lihatMilik` | `/pengunjung` |

Dua lapis: `src/proxy.ts` (per awalan rute) dan `wajibBisa(ability)` di setiap halaman/aksi. Pesanan dan tiket selalu difilter menurut pemilik.

## Asumsi (tidak ditentukan user stories)

1. Booking baru berstatus `booked` (sudah ada di CLAUDE.md). Pembayaran disimulasikan: `booked → waiting for the payment → confirmed`, agar ketiga status filter US7 dapat dicapai. Status `dibatalkan` ada tetapi bukan opsi filter.
2. Pembatalan boleh dari status aktif mana pun selama penerbangan belum berangkat; kursi dikembalikan tepat satu kali.
3. Duplikat booking = pemilik yang sama memesan penerbangan yang sama selagi pesanan sebelumnya belum dibatalkan.
4. Profil member lengkap bila 7 kolom terisi (nama lengkap, tanggal lahir, NIK 16 digit, paspor, telepon, kewarganegaraan, alamat). Profil boleh disimpan sebagian; kelengkapan diperiksa saat validasi tiket. Validasi tiket tidak mencocokkan nama penumpang dengan profil.
5. Periode cuti: tahun + bulan wajib (RB01 menyebut "bulan/tahun kosong" tidak valid), tanggal opsional. Pengajuan ditampilkan bila beririsan dengan periode. Sisa cuti = jatah tahunan − riwayat tahun berjalan (dapat negatif).
6. US4: itinerary multi-ruas (asal→tujuan, tanggal); total harga dan jumlah penerbangan dihitung dari penerbangan termurah tiap ruas. US3: beberapa tujuan dengan asal dan tanggal yang sama, hasil dikelompokkan per tujuan.
7. US8-b: pengunjung dicari berdasarkan email. Bila belum ada, dibuat bersama akun login dengan kata sandi sementara yang hanya ditampilkan sekali kepada Manager Travel. Email yang sudah dipakai akun non-pengunjung ditolak.
8. Satu pemesanan = satu penerbangan (satu tiket). Mem-booking seluruh itinerary multi-destinasi dalam satu booking belum didukung.
9. Seluruh jam penerbangan ditampilkan dalam WIB.
