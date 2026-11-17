-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HRD_MANAGER', 'PENGGUNA', 'MEMBER', 'MANAGER_TRAVEL', 'PENGUNJUNG');

-- CreateEnum
CREATE TYPE "StatusBooking" AS ENUM ('BOOKED', 'WAITING_FOR_PAYMENT', 'CONFIRMED', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusTiket" AS ENUM ('TERBIT', 'TERVALIDASI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusEmail" AS ENUM ('TERKIRIM', 'GAGAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "namaLengkap" TEXT,
    "tglLahir" DATE,
    "nik" TEXT,
    "noPaspor" TEXT,
    "telepon" TEXT,
    "kewarganegaraan" TEXT,
    "alamat" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengunjung" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telepon" TEXT,
    "nik" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pengunjung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bandara" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kota" TEXT NOT NULL,

    CONSTRAINT "Bandara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maskapai" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Maskapai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penerbangan" (
    "id" TEXT NOT NULL,
    "kodePenerbangan" TEXT NOT NULL,
    "maskapaiId" TEXT NOT NULL,
    "asalId" TEXT NOT NULL,
    "tujuanId" TEXT NOT NULL,
    "berangkat" TIMESTAMP(3) NOT NULL,
    "tiba" TIMESTAMP(3) NOT NULL,
    "harga" INTEGER NOT NULL,
    "kursiTersedia" INTEGER NOT NULL,

    CONSTRAINT "Penerbangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "kodeBookingReference" TEXT NOT NULL,
    "pemilikId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "pengunjungId" TEXT,
    "status" "StatusBooking" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiketPesawat" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "penerbanganId" TEXT NOT NULL,
    "nomorTiket" TEXT NOT NULL,
    "namaPenumpang" TEXT NOT NULL,
    "status" "StatusTiket" NOT NULL DEFAULT 'TERBIT',
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TiketPesawat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifikasiEmail" (
    "id" TEXT NOT NULL,
    "tiketId" TEXT NOT NULL,
    "kepada" TEXT NOT NULL,
    "subjek" TEXT NOT NULL,
    "status" "StatusEmail" NOT NULL,
    "error" TEXT,
    "percobaan" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terkirimAt" TIMESTAMP(3),

    CONSTRAINT "NotifikasiEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pegawai" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "jatahCutiTahunan" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermohonanCuti" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "tglMulai" DATE NOT NULL,
    "tglSelesai" DATE NOT NULL,
    "lamaHari" INTEGER NOT NULL,
    "alasan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermohonanCuti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatCuti" (
    "id" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tglMulai" DATE NOT NULL,
    "tglSelesai" DATE NOT NULL,
    "lamaHari" INTEGER NOT NULL,

    CONSTRAINT "RiwayatCuti_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilMember_userId_key" ON "ProfilMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Pengunjung_userId_key" ON "Pengunjung"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bandara_kode_key" ON "Bandara"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Maskapai_kode_key" ON "Maskapai"("kode");

-- CreateIndex
CREATE INDEX "Penerbangan_asalId_tujuanId_berangkat_idx" ON "Penerbangan"("asalId", "tujuanId", "berangkat");

-- CreateIndex
CREATE INDEX "Penerbangan_berangkat_idx" ON "Penerbangan"("berangkat");

-- CreateIndex
CREATE UNIQUE INDEX "Penerbangan_kodePenerbangan_berangkat_key" ON "Penerbangan"("kodePenerbangan", "berangkat");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_kodeBookingReference_key" ON "Booking"("kodeBookingReference");

-- CreateIndex
CREATE INDEX "Booking_pemilikId_idx" ON "Booking"("pemilikId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TiketPesawat_nomorTiket_key" ON "TiketPesawat"("nomorTiket");

-- CreateIndex
CREATE INDEX "TiketPesawat_bookingId_idx" ON "TiketPesawat"("bookingId");

-- CreateIndex
CREATE INDEX "TiketPesawat_penerbanganId_idx" ON "TiketPesawat"("penerbanganId");

-- CreateIndex
CREATE INDEX "NotifikasiEmail_status_idx" ON "NotifikasiEmail"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "Pegawai"("nip");

-- CreateIndex
CREATE INDEX "PermohonanCuti_tglMulai_tglSelesai_idx" ON "PermohonanCuti"("tglMulai", "tglSelesai");

-- CreateIndex
CREATE INDEX "PermohonanCuti_pegawaiId_idx" ON "PermohonanCuti"("pegawaiId");

-- CreateIndex
CREATE INDEX "RiwayatCuti_pegawaiId_tahun_idx" ON "RiwayatCuti"("pegawaiId", "tahun");

-- AddForeignKey
ALTER TABLE "ProfilMember" ADD CONSTRAINT "ProfilMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pengunjung" ADD CONSTRAINT "Pengunjung_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penerbangan" ADD CONSTRAINT "Penerbangan_maskapaiId_fkey" FOREIGN KEY ("maskapaiId") REFERENCES "Maskapai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penerbangan" ADD CONSTRAINT "Penerbangan_asalId_fkey" FOREIGN KEY ("asalId") REFERENCES "Bandara"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penerbangan" ADD CONSTRAINT "Penerbangan_tujuanId_fkey" FOREIGN KEY ("tujuanId") REFERENCES "Bandara"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pemilikId_fkey" FOREIGN KEY ("pemilikId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pengunjungId_fkey" FOREIGN KEY ("pengunjungId") REFERENCES "Pengunjung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiketPesawat" ADD CONSTRAINT "TiketPesawat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiketPesawat" ADD CONSTRAINT "TiketPesawat_penerbanganId_fkey" FOREIGN KEY ("penerbanganId") REFERENCES "Penerbangan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotifikasiEmail" ADD CONSTRAINT "NotifikasiEmail_tiketId_fkey" FOREIGN KEY ("tiketId") REFERENCES "TiketPesawat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermohonanCuti" ADD CONSTRAINT "PermohonanCuti_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatCuti" ADD CONSTRAINT "RiwayatCuti_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
