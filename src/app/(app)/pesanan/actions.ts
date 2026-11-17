"use server";

import { redirect } from "next/navigation";
import { wajibBisa } from "@/server/auth/session";
import { pesanUntukPengguna } from "@/server/errors";
import { batalkanPesanan, bayarPesanan, mulaiPembayaran, prosesPemesanan } from "@/server/services/booking";

export interface PesanState {
  error?: string;
}

/** Halaman Pemesanan → Memproses Pemesanan. Galat ditampilkan di form; sukses menuju detail pesanan. */
export async function pesanAction(_prev: PesanState, formData: FormData): Promise<PesanState> {
  const pengguna = await wajibBisa("booking.kelola");
  let id: string;
  try {
    const pesanan = await prosesPemesanan(pengguna, {
      penerbanganId: formData.get("penerbanganId"),
      namaPenumpang: formData.get("namaPenumpang"),
    });
    id = pesanan.id;
  } catch (error) {
    return { error: pesanUntukPengguna(error) };
  }
  redirect(`/pesanan/${id}`);
}

function idDari(formData: FormData): string {
  const id = formData.get("id");
  return typeof id === "string" ? id : "";
}

/** Menjalankan aksi atas pesanan lalu kembali ke tujuan; galat dibawa lewat ?galat= agar tetap berfungsi tanpa JavaScript. */
async function jalankan(formData: FormData, aksi: (pemilikId: string, id: string) => Promise<unknown>, sukses: (id: string) => string, gagal: (id: string) => string) {
  const pengguna = await wajibBisa("booking.kelola");
  const id = idDari(formData);
  try {
    await aksi(pengguna.id, id);
  } catch (error) {
    redirect(`${gagal(id)}?galat=${encodeURIComponent(pesanUntukPengguna(error))}`);
  }
  redirect(sukses(id));
}

export async function mulaiPembayaranAction(formData: FormData) {
  await jalankan(formData, mulaiPembayaran, (id) => `/pesanan/${id}?info=pembayaran-dimulai`, (id) => `/pesanan/${id}`);
}

export async function bayarAction(formData: FormData) {
  await jalankan(formData, bayarPesanan, (id) => `/pesanan/${id}?info=dibayar`, (id) => `/pesanan/${id}`);
}

export async function batalkanAction(formData: FormData) {
  await jalankan(formData, batalkanPesanan, (id) => `/pesanan/${id}?info=dibatalkan`, (id) => `/pesanan/${id}/batal`);
}
