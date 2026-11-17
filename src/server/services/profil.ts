/** Control untuk profil member (RB09, RB10: "Memperbarui Data Profil", "Memeriksa Kelengkapan Profil"). */
import { db } from "@/server/db";
import { validasi, type GalatField } from "@/server/validation/common";
import { profilSkema, type ProfilInput } from "@/server/validation/profil";

/** Kolom yang wajib terisi agar profil dinyatakan lengkap (US5). */
export const KOLOM_PROFIL = ["namaLengkap", "tglLahir", "nik", "noPaspor", "telepon", "kewarganegaraan", "alamat"] as const;
export type KolomProfil = (typeof KOLOM_PROFIL)[number];

export const LABEL_KOLOM_PROFIL: Record<KolomProfil, string> = {
  namaLengkap: "Nama lengkap",
  tglLahir: "Tanggal lahir",
  nik: "NIK",
  noPaspor: "Nomor paspor",
  telepon: "Nomor telepon",
  kewarganegaraan: "Kewarganegaraan",
  alamat: "Alamat",
};

/** Kolom DATE (tglLahir) dibaca sebagai string "YYYY-MM-DD"; Date tetap diterima untuk kompatibilitas. */
export type DataProfil = { [K in KolomProfil]?: string | Date | null };

/** Murni: kolom yang belum diisi (kosong atau hanya spasi dianggap belum diisi). */
export function kolomBelumLengkap(profil: DataProfil | null | undefined): KolomProfil[] {
  return KOLOM_PROFIL.filter((k) => {
    const nilai = profil?.[k];
    if (nilai instanceof Date) return Number.isNaN(nilai.getTime());
    return nilai === null || nilai === undefined || nilai.trim() === "";
  });
}

export const profilLengkap = (profil: DataProfil | null | undefined) => kolomBelumLengkap(profil).length === 0;

export async function ambilProfil(userId: string) {
  return db.orm.public.ProfilMember.where({ userId }).first();
}

export type HasilSimpanProfil = { ok: true; profil: NonNullable<Awaited<ReturnType<typeof ambilProfil>>> } | { ok: false; galat: GalatField };

/** US5-a "Validasi Input Profil" lalu "Memperbarui Data Profil". Boleh disimpan sebagian; kelengkapan diperiksa saat validasi tiket. */
export async function perbaruiProfil(userId: string, masukan: unknown): Promise<HasilSimpanProfil> {
  const cek = validasi(profilSkema, masukan);
  if (!cek.ok) return { ok: false, galat: cek.galat };
  const data: ProfilInput = cek.data;
  // `conflictOn` hanya diketik untuk kunci primer; `userId` adalah unique constraint yang ada di kontrak (diuji di integrasi).
  const profil = await db.orm.public.ProfilMember.upsert({ create: { userId, ...data }, update: data, conflictOn: { userId } as never });
  return { ok: true, profil };
}

/** Menutupi sebagian besar digit identitas untuk ditampilkan. */
export function samarkan(nilai: string | null | undefined, tampil = 4): string {
  if (!nilai) return "-";
  return nilai.length <= tampil ? nilai : `${"•".repeat(nilai.length - tampil)}${nilai.slice(-tampil)}`;
}
