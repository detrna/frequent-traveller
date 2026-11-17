#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3af4a88de5b135a2a8f1467cfce767fe0119c164d996bff16fc090728f57aac0/contract';
import endContract from '../../snapshots/3af4a88de5b135a2a8f1467cfce767fe0119c164d996bff16fc090728f57aac0/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'Role',
        members: ['HRD_MANAGER', 'PENGGUNA', 'MEMBER', 'MANAGER_TRAVEL', 'PENGUNJUNG'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'StatusBooking',
        members: ['BOOKED', 'WAITING_FOR_PAYMENT', 'CONFIRMED', 'DIBATALKAN'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'StatusEmail',
        members: ['TERKIRIM', 'GAGAL'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'StatusTiket',
        members: ['TERBIT', 'TERVALIDASI', 'DIBATALKAN'],
      }),
      this.createTable({
        schema: 'public',
        table: 'Bandara',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kota', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Booking',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('dibuatOlehId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kodeBookingReference', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('pemilikId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('pengunjungId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"StatusBooking"', {
            notNull: true,
            default: lit('BOOKED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'StatusBooking' } },
          }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Maskapai',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'NotifikasiEmail',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kepada', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('percobaan', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', '"StatusEmail"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'StatusEmail' } },
          }),
          col('subjek', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('terkirimAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('tiketId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Pegawai',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jabatan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jatahCutiTahunan', 'int4', {
            notNull: true,
            default: lit(12),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nip', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Penerbangan',
        columns: [
          col('asalId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('berangkat', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('harga', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kodePenerbangan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kursiTersedia', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('maskapaiId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tiba', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('tujuanId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Pengunjung',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nik', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('telepon', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PermohonanCuti',
        columns: [
          col('alasan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lamaHari', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pegawaiId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tglMulai', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('tglSelesai', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'ProfilMember',
        columns: [
          col('alamat', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kewarganegaraan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('namaLengkap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nik', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('noPaspor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('telepon', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tglLahir', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'RiwayatCuti',
        columns: [
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lamaHari', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pegawaiId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tahun', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tglMulai', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('tglSelesai', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'TiketPesawat',
        columns: [
          col('bookingId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('namaPenumpang', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nomorTiket', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('penerbanganId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"StatusTiket"', {
            notNull: true,
            default: lit('TERBIT'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'StatusTiket' } },
          }),
          col('validatedAt', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamp(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', '"Role"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'Role' } },
          }),
          col('updatedAt', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Bandara',
        index: 'Bandara_kode_key',
        columns: ['kode'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Booking',
        index: 'Booking_kodeBookingReference_key',
        columns: ['kodeBookingReference'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Booking',
        index: 'Booking_pemilikId_idx',
        columns: ['pemilikId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Booking',
        index: 'Booking_status_idx',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Maskapai',
        index: 'Maskapai_kode_key',
        columns: ['kode'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'NotifikasiEmail',
        index: 'NotifikasiEmail_status_idx',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Pegawai',
        index: 'Pegawai_nip_key',
        columns: ['nip'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Penerbangan',
        index: 'Penerbangan_asalId_tujuanId_berangkat_idx',
        columns: ['asalId', 'tujuanId', 'berangkat'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Penerbangan',
        index: 'Penerbangan_berangkat_idx',
        columns: ['berangkat'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Penerbangan',
        index: 'Penerbangan_kodePenerbangan_berangkat_key',
        columns: ['kodePenerbangan', 'berangkat'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Pengunjung',
        index: 'Pengunjung_userId_key',
        columns: ['userId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'PermohonanCuti',
        index: 'PermohonanCuti_pegawaiId_idx',
        columns: ['pegawaiId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PermohonanCuti',
        index: 'PermohonanCuti_tglMulai_tglSelesai_idx',
        columns: ['tglMulai', 'tglSelesai'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ProfilMember',
        index: 'ProfilMember_userId_key',
        columns: ['userId'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'RiwayatCuti',
        index: 'RiwayatCuti_pegawaiId_tahun_idx',
        columns: ['pegawaiId', 'tahun'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TiketPesawat',
        index: 'TiketPesawat_bookingId_idx',
        columns: ['bookingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'TiketPesawat',
        index: 'TiketPesawat_nomorTiket_key',
        columns: ['nomorTiket'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'TiketPesawat',
        index: 'TiketPesawat_penerbanganId_idx',
        columns: ['penerbanganId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Booking',
        foreignKey: {
          name: 'Booking_pemilikId_fkey',
          columns: ['pemilikId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Booking',
        foreignKey: {
          name: 'Booking_dibuatOlehId_fkey',
          columns: ['dibuatOlehId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Booking',
        foreignKey: {
          name: 'Booking_pengunjungId_fkey',
          columns: ['pengunjungId'],
          references: { schema: 'public', table: 'Pengunjung', columns: ['id'] },
          onDelete: 'setNull',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'NotifikasiEmail',
        foreignKey: {
          name: 'NotifikasiEmail_tiketId_fkey',
          columns: ['tiketId'],
          references: { schema: 'public', table: 'TiketPesawat', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Penerbangan',
        foreignKey: {
          name: 'Penerbangan_maskapaiId_fkey',
          columns: ['maskapaiId'],
          references: { schema: 'public', table: 'Maskapai', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Penerbangan',
        foreignKey: {
          name: 'Penerbangan_asalId_fkey',
          columns: ['asalId'],
          references: { schema: 'public', table: 'Bandara', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Penerbangan',
        foreignKey: {
          name: 'Penerbangan_tujuanId_fkey',
          columns: ['tujuanId'],
          references: { schema: 'public', table: 'Bandara', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Pengunjung',
        foreignKey: {
          name: 'Pengunjung_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PermohonanCuti',
        foreignKey: {
          name: 'PermohonanCuti_pegawaiId_fkey',
          columns: ['pegawaiId'],
          references: { schema: 'public', table: 'Pegawai', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ProfilMember',
        foreignKey: {
          name: 'ProfilMember_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RiwayatCuti',
        foreignKey: {
          name: 'RiwayatCuti_pegawaiId_fkey',
          columns: ['pegawaiId'],
          references: { schema: 'public', table: 'Pegawai', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TiketPesawat',
        foreignKey: {
          name: 'TiketPesawat_bookingId_fkey',
          columns: ['bookingId'],
          references: { schema: 'public', table: 'Booking', columns: ['id'] },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'TiketPesawat',
        foreignKey: {
          name: 'TiketPesawat_penerbanganId_fkey',
          columns: ['penerbanganId'],
          references: { schema: 'public', table: 'Penerbangan', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
