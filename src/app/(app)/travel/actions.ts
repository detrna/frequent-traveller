"use server";

import { redirect } from "next/navigation";
import { wajibBisa } from "@/server/auth/session";
import { GalatValidasi, pesanUntukPengguna } from "@/server/errors";
import { kirimUlangEtiket, pesanUntukPengunjung } from "@/server/services/travel";

export interface PesanPengunjungState {
  error?: string;
  galat?: Record<string, string>;
  nilai?: Record<string, string>;
  hasil?: {
    bookingId: string;
    kodeBooking: string;
    status: string;
    namaPengunjung: string;
    emailPengunjung: string;
    akunBaru: boolean;
    /** Hanya ada untuk akun pengunjung baru; ditampilkan sekali dan tidak disimpan. */
    kataSandiSementara?: string;
    etiket: { terkirim: number; gagal: number; dilewati: number; galat?: string; pesanGalat?: string };
  };
}

/** Halaman Pemesanan Pengunjung → Validasi Data Pengunjung → Membuat Booking Pengunjung (SQ15). */
export async function pesanUntukPengunjungAction(_prev: PesanPengunjungState, formData: FormData): Promise<PesanPengunjungState> {
  const manager = await wajibBisa("travel.kelola");
  const nilai = Object.fromEntries(["nama", "email", "telepon", "nik"].map((k) => [k, String(formData.get(k) ?? "")]));
  try {
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId: formData.get("penerbanganId"), pengunjung: nilai });
    const etiket = "galat" in hasil.etiket ? { terkirim: 0, gagal: 0, dilewati: 0, galat: hasil.etiket.galat } : hasil.etiket;
    return {
      hasil: {
        bookingId: hasil.booking.id,
        kodeBooking: hasil.booking.kodeBookingReference,
        status: hasil.booking.status,
        namaPengunjung: hasil.pengunjung.nama,
        emailPengunjung: hasil.pengunjung.email,
        akunBaru: hasil.akunBaru,
        kataSandiSementara: hasil.kataSandiSementara,
        etiket: { terkirim: etiket.terkirim, gagal: etiket.gagal, dilewati: etiket.dilewati, galat: "galat" in etiket ? etiket.galat : undefined },
      },
    };
  } catch (error) {
    if (error instanceof GalatValidasi) return { galat: error.galat, nilai };
    return { error: pesanUntukPengguna(error), nilai };
  }
}

/** Mengirim ulang e-tiket yang gagal; kembali ke halaman detail dengan hasilnya. */
export async function kirimUlangEtiketAction(formData: FormData) {
  await wajibBisa("travel.kelola");
  const id = String(formData.get("id") ?? "");
  let tujuan: string;
  try {
    const hasil = await kirimUlangEtiket(id);
    tujuan =
      hasil.gagal > 0
        ? `/travel/booking/${id}?galat=${encodeURIComponent("E-tiket masih gagal dikirim. Periksa konfigurasi email lalu coba lagi.")}`
        : `/travel/booking/${id}?info=${hasil.terkirim > 0 ? "etiket-terkirim" : "etiket-sudah-terkirim"}`;
  } catch (error) {
    tujuan = `/travel/booking/${id}?galat=${encodeURIComponent(pesanUntukPengguna(error))}`;
  }
  redirect(tujuan);
}
