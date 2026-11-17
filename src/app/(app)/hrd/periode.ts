import { ambilSatu, type SearchParams } from "@/lib/query";
import { tanggalWIB } from "@/lib/waktu";
import { tahunBerjalan } from "@/server/services/cuti";

/** Membaca periode dari query. Tanpa parameter apa pun, bawaannya bulan berjalan agar halaman langsung berisi. */
export function bacaPeriode(sp: SearchParams) {
  const adaParam = ["tahun", "bulan", "tanggal"].some((k) => sp[k] !== undefined);
  const hariIni = tanggalWIB();
  const nilai = adaParam
    ? { tahun: ambilSatu(sp, "tahun"), bulan: ambilSatu(sp, "bulan"), tanggal: ambilSatu(sp, "tanggal") }
    : { tahun: hariIni.slice(0, 4), bulan: String(Number(hariIni.slice(5, 7))), tanggal: "" };
  const tahun = tahunBerjalan();
  return { nilai, tahunDari: tahun - 2, tahunSampai: tahun + 3 };
}
