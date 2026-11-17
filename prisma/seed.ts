/**
 * Data contoh APS. DETERMINISTIK (PRNG bertanam) dan MENGHAPUS data lama.
 * Menolak berjalan ke database cloud kecuali diberi --force-cloud.
 *
 * Akun demo (kata sandi semuanya: Demo#12345):
 *   hrd@aps.test        HRD Manager
 *   pengguna@aps.test   Pengguna
 *   member@aps.test     Member Frequent Traveller (profil LENGKAP)
 *   member2@aps.test    Member Frequent Traveller (profil KOSONG → uji "data profil tidak lengkap")
 *   travel@aps.test     Manager Travel
 *   pengunjung1@aps.test, pengunjung2@aps.test   Pengunjung
 */
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { describeUrl, getDatabaseUrl, getDbTarget } from "../src/server/db-target";
import { closeDb, createDb } from "../src/server/prisma-client";
import { Role, StatusBooking, StatusEmail, StatusTiket } from "../src/lib/enums";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const PASSWORD_DEMO = "Demo#12345";
const HARI_KE_DEPAN = 30;
const MS_HARI = 86_400_000;

// ---------- util ----------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const acak = mulberry32(20261117);
const pilih = <T,>(arr: readonly T[]): T => arr[Math.floor(acak() * arr.length)];
const antara = (min: number, max: number) => min + Math.floor(acak() * (max - min + 1));

function tanggalUTC(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}
function tambahHari(d: Date, n: number) {
  return new Date(d.getTime() + n * MS_HARI);
}
/** Kolom DATE dibaca/ditulis Prisma 8 sebagai string "YYYY-MM-DD". */
const tglString = (d: Date) => d.toISOString().slice(0, 10);
function lamaHari(mulai: Date, selesai: Date) {
  return Math.round((selesai.getTime() - mulai.getTime()) / MS_HARI) + 1;
}

// ---------- data referensi ----------
const BANDARA = [
  { kode: "CGK", nama: "Soekarno-Hatta", kota: "Jakarta", lat: -6.13, lon: 106.66 },
  { kode: "SUB", nama: "Juanda", kota: "Surabaya", lat: -7.38, lon: 112.79 },
  { kode: "DPS", nama: "I Gusti Ngurah Rai", kota: "Denpasar", lat: -8.75, lon: 115.17 },
  { kode: "UPG", nama: "Sultan Hasanuddin", kota: "Makassar", lat: -5.06, lon: 119.55 },
  { kode: "KNO", nama: "Kualanamu", kota: "Medan", lat: 3.64, lon: 98.88 },
  { kode: "YIA", nama: "Yogyakarta International", kota: "Yogyakarta", lat: -7.9, lon: 110.06 },
  { kode: "BPN", nama: "Sultan Aji Muhammad Sulaiman", kota: "Balikpapan", lat: -1.27, lon: 116.89 },
  { kode: "PLM", nama: "Sultan Mahmud Badaruddin II", kota: "Palembang", lat: -2.9, lon: 104.7 },
  { kode: "BDO", nama: "Husein Sastranegara", kota: "Bandung", lat: -6.9, lon: 107.58 },
  { kode: "SRG", nama: "Jenderal Ahmad Yani", kota: "Semarang", lat: -6.97, lon: 110.37 },
  { kode: "LOP", nama: "Lombok International", kota: "Lombok", lat: -8.76, lon: 116.28 },
  { kode: "MDC", nama: "Sam Ratulangi", kota: "Manado", lat: 1.55, lon: 124.93 },
] as const;

const MASKAPAI = [
  { kode: "GA", nama: "Garuda Indonesia", faktor: 1.25 },
  { kode: "ID", nama: "Batik Air", faktor: 1.0 },
  { kode: "IP", nama: "Pelita Air", faktor: 0.95 },
  { kode: "JT", nama: "Lion Air", faktor: 0.85 },
  { kode: "QG", nama: "Citilink", faktor: 0.8 },
  { kode: "IU", nama: "Super Air Jet", faktor: 0.78 },
] as const;

const HUB = ["CGK", "SUB", "DPS", "UPG", "KNO"];
const SPOKE_KE_CGK = ["YIA", "BPN", "PLM", "BDO", "SRG", "LOP", "MDC"];
const RUTE_TAMBAHAN: Array<[string, string]> = [
  ["YIA", "DPS"],
  ["MDC", "UPG"],
  ["BPN", "SUB"],
];

function daftarRute(): Array<[string, string]> {
  const rute: Array<[string, string]> = [];
  for (const a of HUB) for (const b of HUB) if (a !== b) rute.push([a, b]);
  for (const s of SPOKE_KE_CGK) rute.push(["CGK", s], [s, "CGK"]);
  for (const [a, b] of RUTE_TAMBAHAN) rute.push([a, b], [b, a]);
  return rute;
}

function jarakKm(a: (typeof BANDARA)[number], b: (typeof BANDARA)[number]) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// ---------- pengaman ----------
function pastikanBolehSeed() {
  const target = getDbTarget();
  if (target === "cloud" && !process.argv.includes("--force-cloud")) {
    console.error('\n✖ Seed ditolak: DB_TARGET=cloud. Tambahkan --force-cloud bila memang disengaja (data lama DIHAPUS).\n');
    process.exit(1);
  }
}

async function main() {
  pastikanBolehSeed();
  const url = getDatabaseUrl();
  console.log(`Seed ke ${describeUrl(url)} (${getDbTarget()})`);
  const db = createDb(url);

  try {
    // ----- bersihkan (satu perintah; CASCADE menangani urutan ketergantungan) -----
    await db.execute(
      db.raw.sql`TRUNCATE TABLE "public"."NotifikasiEmail", "public"."TiketPesawat", "public"."Booking", "public"."Penerbangan", "public"."Maskapai", "public"."Bandara", "public"."Pengunjung", "public"."ProfilMember", "public"."User", "public"."RiwayatCuti", "public"."PermohonanCuti", "public"."Pegawai" CASCADE`
        .affectedCount()
        .build(),
    );

    // ----- pengguna & profil -----
    const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
    const buatUser = (nama: string, email: string, role: Role) => db.orm.public.User.create({ nama, email, role, passwordHash });

    await buatUser("Sari Wulandari", "hrd@aps.test", Role.HRD_MANAGER);
    const pengguna = await buatUser("Budi Santoso", "pengguna@aps.test", Role.PENGGUNA);
    const member = await buatUser("Citra Lestari", "member@aps.test", Role.MEMBER);
    const member2 = await buatUser("Dimas Prasetyo", "member2@aps.test", Role.MEMBER);
    const travel = await buatUser("Eka Nugraha", "travel@aps.test", Role.MANAGER_TRAVEL);
    const userPengunjung1 = await buatUser("Fajar Hidayat", "pengunjung1@aps.test", Role.PENGUNJUNG);
    const userPengunjung2 = await buatUser("Gita Permata", "pengunjung2@aps.test", Role.PENGUNJUNG);

    await db.orm.public.ProfilMember.create({
      userId: member.id,
      namaLengkap: "Citra Lestari Wijaya",
      tglLahir: tglString(tanggalUTC(1992, 4, 17)),
      nik: "3174015705920001",
      noPaspor: "C1234567",
      telepon: "081234567890",
      kewarganegaraan: "Indonesia",
      alamat: "Jl. Melati No. 10, Jakarta Selatan",
    });
    await db.orm.public.ProfilMember.create({ userId: member2.id }); // kosong → profil tidak lengkap

    const pengunjung1 = await db.orm.public.Pengunjung.create({
      userId: userPengunjung1.id, nama: "Fajar Hidayat", email: "pengunjung1@aps.test", telepon: "081300000001", nik: "3578010101900001",
    });
    const pengunjung2 = await db.orm.public.Pengunjung.create({
      userId: userPengunjung2.id, nama: "Gita Permata", email: "pengunjung2@aps.test", telepon: "081300000002", nik: "3578010101900002",
    });

    // ----- bandara, maskapai, penerbangan -----
    await db.orm.public.Bandara.createAndCount(BANDARA.map(({ kode, nama, kota }) => ({ kode, nama, kota })));
    await db.orm.public.Maskapai.createAndCount(MASKAPAI.map(({ kode, nama }) => ({ kode, nama })));
    const bandaraRows = await db.orm.public.Bandara.all();
    const maskapaiRows = await db.orm.public.Maskapai.all();
    const idBandara = new Map(bandaraRows.map((b) => [b.kode, b.id]));
    const idMaskapai = new Map(maskapaiRows.map((m) => [m.kode, m.id]));
    const infoBandara = new Map<string, (typeof BANDARA)[number]>(BANDARA.map((b) => [b.kode, b]));

    const sekarang = new Date();
    const hariIni = tanggalUTC(sekarang.getUTCFullYear(), sekarang.getUTCMonth(), sekarang.getUTCDate());
    const rute = daftarRute();
    const penerbangan: Array<{
      kodePenerbangan: string;
      maskapaiId: string;
      asalId: string;
      tujuanId: string;
      berangkat: Date;
      tiba: Date;
      harga: number;
      kursiTersedia: number;
    }> = [];

    rute.forEach(([asal, tujuan], idxRute) => {
      const jarak = jarakKm(infoBandara.get(asal)!, infoBandara.get(tujuan)!);
      const hargaDasar = 350_000 + jarak * 450;
      const durasiMenit = Math.round(45 + jarak / 13);
      for (let hari = 1; hari <= HARI_KE_DEPAN; hari++) {
        const tanggal = tambahHari(hariIni, hari);
        const akhirPekan = [0, 5, 6].includes(tanggal.getUTCDay());
        const jamSlot = [pilih([5, 6, 7, 8, 9]), pilih([15, 16, 17, 18, 19])];
        const maskapaiHariIni = [pilih(MASKAPAI), pilih(MASKAPAI)];
        if (maskapaiHariIni[0].kode === maskapaiHariIni[1].kode) {
          maskapaiHariIni[1] = MASKAPAI[(MASKAPAI.findIndex((m) => m.kode === maskapaiHariIni[0].kode) + 1) % MASKAPAI.length];
        }
        jamSlot.forEach((jam, slot) => {
          const mk = maskapaiHariIni[slot];
          const menit = pilih([0, 15, 30, 45]);
          // jam diasumsikan WIB (UTC+7) → simpan sebagai UTC
          const berangkat = new Date(tanggal.getTime() + (jam - 7) * 3_600_000 + menit * 60_000);
          const tiba = new Date(berangkat.getTime() + durasiMenit * 60_000);
          const variasi = 0.88 + acak() * 0.24;
          const harga = Math.round((hargaDasar * mk.faktor * variasi * (akhirPekan ? 1.12 : 1)) / 1000) * 1000;
          penerbangan.push({
            kodePenerbangan: `${mk.kode}${100 + ((idxRute * 7 + slot * 3 + hari) % 900)}`,
            maskapaiId: idMaskapai.get(mk.kode)!,
            asalId: idBandara.get(asal)!,
            tujuanId: idBandara.get(tujuan)!,
            berangkat,
            tiba,
            harga,
            kursiTersedia: antara(20, 150),
          });
        });
      }
    });
    // unique(kodePenerbangan, berangkat): buang bentrokan yang mungkin muncul dari penomoran
    const sudah = new Set<string>();
    const unik = penerbangan.filter((p) => {
      const kunci = `${p.kodePenerbangan}|${p.berangkat.toISOString()}`;
      if (sudah.has(kunci)) return false;
      sudah.add(kunci);
      return true;
    });
    for (let i = 0; i < unik.length; i += 1000) {
      await db.orm.public.Penerbangan.createAndCount(unik.slice(i, i + 1000));
    }

    // ----- booking contoh di semua status -----
    const ambilPenerbangan = (asal: string, tujuan: string, hari: number) => {
      const dari = tambahHari(hariIni, hari);
      return db.orm.public.Penerbangan.where({ asalId: idBandara.get(asal)!, tujuanId: idBandara.get(tujuan)! })
        .where((p) => p.berangkat.gte(dari))
        .orderBy((p) => p.berangkat.asc())
        .firstOrThrow();
    };

    async function buatBooking(opts: {
      kode: string;
      pemilik: { id: string; nama: string };
      dibuatOleh: { id: string };
      pengunjungId?: string;
      status: StatusBooking;
      statusTiket?: StatusTiket;
      penerbanganId: string;
      namaPenumpang: string;
    }) {
      const statusTiket =
        opts.statusTiket ?? (opts.status === StatusBooking.DIBATALKAN ? StatusTiket.DIBATALKAN : StatusTiket.TERBIT);
      const booking = await db.orm.public.Booking.create({
        kodeBookingReference: opts.kode,
        pemilikId: opts.pemilik.id,
        dibuatOlehId: opts.dibuatOleh.id,
        pengunjungId: opts.pengunjungId ?? null,
        status: opts.status,
      });
      const tiket = await db.orm.public.TiketPesawat.create({
        bookingId: booking.id,
        penerbanganId: opts.penerbanganId,
        nomorTiket: `TKT-${opts.kode}-1`,
        namaPenumpang: opts.namaPenumpang,
        status: statusTiket,
        validatedAt: statusTiket === StatusTiket.TERVALIDASI ? new Date() : null,
      });
      if (opts.status !== StatusBooking.DIBATALKAN) {
        await db.execute(
          db.raw.sql`UPDATE "public"."Penerbangan" SET "kursiTersedia" = "kursiTersedia" - 1 WHERE "id" = ${opts.penerbanganId}`.affectedCount().build(),
        );
      }
      return { booking, tiketId: tiket.id };
    }

    const f1 = await ambilPenerbangan("CGK", "DPS", 2);
    const f2 = await ambilPenerbangan("CGK", "SUB", 3);
    const f3 = await ambilPenerbangan("SUB", "CGK", 5);
    const f4 = await ambilPenerbangan("DPS", "CGK", 6);
    const f5 = await ambilPenerbangan("CGK", "UPG", 4);
    const f6 = await ambilPenerbangan("CGK", "KNO", 7);
    const f7 = await ambilPenerbangan("UPG", "CGK", 9);
    const f8 = await ambilPenerbangan("CGK", "YIA", 8);

    await buatBooking({ kode: "AP5T3K", pemilik: pengguna, dibuatOleh: pengguna, status: StatusBooking.BOOKED, penerbanganId: f1.id, namaPenumpang: pengguna.nama });
    await buatBooking({ kode: "AP7B2M", pemilik: pengguna, dibuatOleh: pengguna, status: StatusBooking.WAITING_FOR_PAYMENT, penerbanganId: f2.id, namaPenumpang: pengguna.nama });
    await buatBooking({ kode: "AP9C4N", pemilik: pengguna, dibuatOleh: pengguna, status: StatusBooking.CONFIRMED, penerbanganId: f3.id, namaPenumpang: pengguna.nama });
    await buatBooking({ kode: "AP6D8P", pemilik: pengguna, dibuatOleh: pengguna, status: StatusBooking.DIBATALKAN, penerbanganId: f4.id, namaPenumpang: pengguna.nama });

    await buatBooking({ kode: "AP3E5Q", pemilik: member, dibuatOleh: member, status: StatusBooking.BOOKED, penerbanganId: f5.id, namaPenumpang: "Citra Lestari Wijaya" });
    await buatBooking({ kode: "AP4F7R", pemilik: member, dibuatOleh: member, status: StatusBooking.CONFIRMED, statusTiket: StatusTiket.TERVALIDASI, penerbanganId: f6.id, namaPenumpang: "Citra Lestari Wijaya" });
    await buatBooking({ kode: "AP2G6S", pemilik: member2, dibuatOleh: member2, status: StatusBooking.BOOKED, penerbanganId: f7.id, namaPenumpang: member2.nama });

    const bk1 = await buatBooking({ kode: "AP8H2T", pemilik: userPengunjung1, dibuatOleh: travel, pengunjungId: pengunjung1.id, status: StatusBooking.CONFIRMED, penerbanganId: f8.id, namaPenumpang: pengunjung1.nama });
    await db.orm.public.NotifikasiEmail.create({
      tiketId: bk1.tiketId, kepada: pengunjung1.email, subjek: "E-tiket APS AP8H2T", status: StatusEmail.TERKIRIM, error: null, percobaan: 1, terkirimAt: new Date(),
    });
    const f9 = await ambilPenerbangan("SUB", "DPS", 10);
    const bk2 = await buatBooking({ kode: "AP4J9V", pemilik: userPengunjung2, dibuatOleh: travel, pengunjungId: pengunjung2.id, status: StatusBooking.WAITING_FOR_PAYMENT, penerbanganId: f9.id, namaPenumpang: pengunjung2.nama });
    await db.orm.public.NotifikasiEmail.create({
      tiketId: bk2.tiketId, kepada: pengunjung2.email, subjek: "E-tiket APS AP4J9V", status: StatusEmail.GAGAL, error: "Contoh: SMTP tidak dapat dihubungi", percobaan: 1, terkirimAt: null,
    });

    // ----- cuti pegawai (US1) -----
    const NAMA_PEGAWAI = [
      ["Agus Setiawan", "Staf Keuangan"], ["Bunga Maharani", "Staf Pemasaran"], ["Candra Kusuma", "Analis Data"],
      ["Dewi Anggraini", "Staf HRD"], ["Eko Prabowo", "Teknisi Jaringan"], ["Farah Nabila", "Desainer"],
      ["Galih Ramadhan", "Pengembang Perangkat Lunak"], ["Hana Puspita", "Staf Legal"], ["Indra Gunawan", "Supervisor Operasional"],
      ["Jihan Aulia", "Staf Pengadaan"], ["Krisna Adi", "Customer Service"], ["Lina Marlina", "Akuntan"],
    ] as const;
    const tahun = hariIni.getUTCFullYear();
    const bulan = hariIni.getUTCMonth();

    for (const [idx, [nama, jabatan]] of NAMA_PEGAWAI.entries()) {
      const pegawai = await db.orm.public.Pegawai.create({
        nama, jabatan, nip: `19900${String(idx + 1).padStart(2, "0")}${tahun - 2}`, jatahCutiTahunan: 12,
      });

      // riwayat: tahun lalu + (sebagian) tahun berjalan yang sudah lewat
      const riwayat: Array<{ mulai: Date; selesai: Date }> = [];
      riwayat.push({ mulai: tanggalUTC(tahun - 1, antara(0, 10), antara(1, 20)), selesai: tanggalUTC(tahun - 1, 11, 28) });
      riwayat[0].selesai = tambahHari(riwayat[0].mulai, antara(1, 4));
      if (bulan > 1 && idx % 2 === 0) {
        const mulai = tanggalUTC(tahun, antara(0, bulan - 1), antara(1, 20));
        riwayat.push({ mulai, selesai: tambahHari(mulai, antara(0, 3)) });
      }
      for (const r of riwayat) {
        await db.orm.public.RiwayatCuti.create({
          pegawaiId: pegawai.id, tahun: r.mulai.getUTCFullYear(), tglMulai: tglString(r.mulai), tglSelesai: tglString(r.selesai), lamaHari: lamaHari(r.mulai, r.selesai),
        });
      }

      // permohonan: tersebar di bulan lalu, bulan ini, dan 2 bulan ke depan (tidak semua pegawai mengajukan)
      if (idx % 4 !== 3) {
        const jumlah = idx % 3 === 0 ? 2 : 1;
        for (let k = 0; k < jumlah; k++) {
          const mulai = tanggalUTC(tahun, bulan + antara(-1, 2), antara(1, 25));
          const selesai = tambahHari(mulai, antara(0, 5));
          await db.orm.public.PermohonanCuti.create({
            pegawaiId: pegawai.id, tglMulai: tglString(mulai), tglSelesai: tglString(selesai), lamaHari: lamaHari(mulai, selesai), alasan: pilih(["Liburan keluarga", "Keperluan pribadi", "Acara keluarga", "Istirahat"]),
          });
        }
      }
    }

    const ringkasan = {
      user: (await db.orm.public.User.aggregate((a) => ({ n: a.count() }))).n,
      bandara: (await db.orm.public.Bandara.aggregate((a) => ({ n: a.count() }))).n,
      maskapai: (await db.orm.public.Maskapai.aggregate((a) => ({ n: a.count() }))).n,
      penerbangan: (await db.orm.public.Penerbangan.aggregate((a) => ({ n: a.count() }))).n,
      booking: (await db.orm.public.Booking.aggregate((a) => ({ n: a.count() }))).n,
      pegawai: (await db.orm.public.Pegawai.aggregate((a) => ({ n: a.count() }))).n,
      permohonanCuti: (await db.orm.public.PermohonanCuti.aggregate((a) => ({ n: a.count() }))).n,
      riwayatCuti: (await db.orm.public.RiwayatCuti.aggregate((a) => ({ n: a.count() }))).n,
    };
    console.table(ringkasan);
    console.log(`Akun demo: *@aps.test — kata sandi "${PASSWORD_DEMO}"`);
  } finally {
    await closeDb(db);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
