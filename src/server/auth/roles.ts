/**
 * Peran, kemampuan (ability), dan aturan akses rute. Murni (tanpa database) agar mudah diuji
 * dan bisa dipakai oleh proxy.ts maupun server component.
 */
import { Role } from "@/lib/enums";

export { Role };

export const ROLE_LABEL: Record<Role, string> = {
  HRD_MANAGER: "HRD Manager",
  PENGGUNA: "Pengguna",
  MEMBER: "Member Frequent Traveller",
  MANAGER_TRAVEL: "Manager Travel",
  PENGUNJUNG: "Pengunjung",
};

/** Kemampuan per use case. Dipakai di service (otorisasi sebenarnya) dan UI (menyembunyikan menu). */
export type Ability =
  | "cuti.lihat" // US1
  | "penerbangan.cari" // US2-a, US3
  | "booking.kelola" // US2-b/c, US6-c: pesan, bayar, batalkan, lihat milik sendiri
  | "member.fitur" // US4, US5, US6-a/b
  | "travel.kelola" // US7, US8-a/b, US9
  | "tiket.lihatMilik"; // US8-c

const ABILITIES: Record<Role, readonly Ability[]> = {
  HRD_MANAGER: ["cuti.lihat"],
  PENGGUNA: ["penerbangan.cari", "booking.kelola", "tiket.lihatMilik"],
  MEMBER: ["penerbangan.cari", "booking.kelola", "tiket.lihatMilik", "member.fitur"],
  MANAGER_TRAVEL: ["travel.kelola"],
  PENGUNJUNG: ["tiket.lihatMilik"],
};

export function can(role: Role | undefined | null, ability: Ability): boolean {
  return !!role && ABILITIES[role].includes(ability);
}

/** Awalan rute → peran yang boleh masuk. Rute yang tidak terdaftar cukup butuh login. */
export const ROUTE_ACCESS: ReadonlyArray<{ prefix: string; roles: readonly Role[] }> = [
  { prefix: "/hrd", roles: ["HRD_MANAGER"] },
  { prefix: "/penerbangan", roles: ["PENGGUNA", "MEMBER"] },
  { prefix: "/pesanan", roles: ["PENGGUNA", "MEMBER"] },
  { prefix: "/member", roles: ["MEMBER"] },
  { prefix: "/travel", roles: ["MANAGER_TRAVEL"] },
  { prefix: "/pengunjung", roles: ["PENGUNJUNG"] },
];

const PUBLIC_PATHS = ["/", "/login", "/akses-ditolak"];

export const HOME_PATH = "/dashboard";

function cocokAwalan(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export type KeputusanAkses = "izinkan" | "ke-login" | "ke-beranda" | "ditolak";

/** Keputusan proxy untuk sebuah permintaan. */
export function putuskanAkses(pathname: string, role: Role | undefined | null): KeputusanAkses {
  if (pathname === "/login") return role ? "ke-beranda" : "izinkan";
  if (PUBLIC_PATHS.includes(pathname)) return "izinkan";
  if (!role) return "ke-login";
  const aturan = ROUTE_ACCESS.find((a) => cocokAwalan(pathname, a.prefix));
  if (aturan && !aturan.roles.includes(role)) return "ditolak";
  return "izinkan";
}

export interface NavItem {
  href: string;
  label: string;
  /** Penjelasan singkat untuk kartu di dashboard. */
  deskripsi: string;
  roles: readonly Role[];
}

/** Menu navigasi. Tambahkan entri di sini saat sebuah halaman selesai dibuat. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/hrd/jadwal-cuti", label: "Jadwal Cuti", deskripsi: "Lihat siapa saja yang cuti pada periode tertentu dan berapa lama.", roles: ["HRD_MANAGER"] },
  { href: "/hrd/pengajuan", label: "Pengajuan Cuti", deskripsi: "Nama pegawai, periode, dan lama cuti yang diajukan.", roles: ["HRD_MANAGER"] },
  { href: "/hrd/riwayat", label: "Riwayat Cuti", deskripsi: "Riwayat cuti dan sisa cuti tahun berjalan tiap pegawai.", roles: ["HRD_MANAGER"] },
  { href: "/penerbangan/cari", label: "Cari Penerbangan", deskripsi: "Lihat jadwal, maskapai, dan harga tiket sesuai tujuan dan tanggal.", roles: ["PENGGUNA", "MEMBER"] },
  { href: "/penerbangan/multi-tujuan", label: "Beberapa Tujuan", deskripsi: "Cari penerbangan ke beberapa kota tujuan sekaligus.", roles: ["PENGGUNA", "MEMBER"] },
  { href: "/pesanan", label: "Pesanan Saya", deskripsi: "Lihat, bayar, atau batalkan pesanan tiket Anda.", roles: ["PENGGUNA", "MEMBER"] },
  { href: "/travel/status", label: "Status Booking", deskripsi: "Lihat semua booking dan filter berdasarkan status.", roles: ["MANAGER_TRAVEL"] },
  { href: "/travel/otorisasi", label: "Otorisasi Tiket", deskripsi: "Verifikasi status booking dengan kode booking reference.", roles: ["MANAGER_TRAVEL"] },
  { href: "/travel/cari", label: "Cari & Pesan Tiket", deskripsi: "Cari tiket penerbangan dan pesankan atas nama pengunjung.", roles: ["MANAGER_TRAVEL"] },
  { href: "/pengunjung/tiket", label: "Tiket Saya", deskripsi: "Lihat tiket yang telah dipesankan atas nama Anda.", roles: ["PENGUNJUNG"] },
  { href: "/member/profil", label: "Profil", deskripsi: "Lengkapi data personal Anda untuk validasi tiket.", roles: ["MEMBER"] },
  { href: "/member/validasi", label: "Validasi Tiket", deskripsi: "Validasi tiket menggunakan data profil Anda.", roles: ["MEMBER"] },
  { href: "/member/preferensi", label: "Preferensi", deskripsi: "Cari penerbangan sesuai tujuan, tanggal, dan jam keberangkatan.", roles: ["MEMBER"] },
  { href: "/member/bandingkan", label: "Bandingkan Harga", deskripsi: "Bandingkan harga tiket yang sesuai preferensi Anda.", roles: ["MEMBER"] },
  { href: "/member/multi-destinasi", label: "Multi-Destinasi", deskripsi: "Susun perjalanan beberapa kota dan bandingkan total harganya.", roles: ["MEMBER"] },
];

export function navUntuk(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
