import { describe, expect, it } from "vitest";
import { can, putuskanAkses, ROUTE_ACCESS, ROLE_LABEL } from "@/server/auth/roles";
import { Role } from "@/generated/prisma/enums";

const SEMUA_ROLE = Object.values(Role);

describe("can", () => {
  it("HRD hanya boleh melihat cuti", () => {
    expect(can("HRD_MANAGER", "cuti.lihat")).toBe(true);
    expect(can("HRD_MANAGER", "booking.kelola")).toBe(false);
    expect(can("HRD_MANAGER", "travel.kelola")).toBe(false);
  });
  it("Pengguna dapat mencari dan memesan tetapi tidak memakai fitur member", () => {
    expect(can("PENGGUNA", "penerbangan.cari")).toBe(true);
    expect(can("PENGGUNA", "booking.kelola")).toBe(true);
    expect(can("PENGGUNA", "member.fitur")).toBe(false);
  });
  it("Member memiliki semua kemampuan Pengguna ditambah fitur member", () => {
    expect(can("MEMBER", "penerbangan.cari")).toBe(true);
    expect(can("MEMBER", "booking.kelola")).toBe(true);
    expect(can("MEMBER", "member.fitur")).toBe(true);
  });
  it("Manager Travel hanya mengelola fitur travel", () => {
    expect(can("MANAGER_TRAVEL", "travel.kelola")).toBe(true);
    expect(can("MANAGER_TRAVEL", "booking.kelola")).toBe(false);
  });
  it("Pengunjung hanya melihat tiket miliknya", () => {
    expect(can("PENGUNJUNG", "tiket.lihatMilik")).toBe(true);
    expect(can("PENGUNJUNG", "booking.kelola")).toBe(false);
  });
  it("tanpa peran → tidak boleh apa pun", () => {
    expect(can(undefined, "penerbangan.cari")).toBe(false);
    expect(can(null, "cuti.lihat")).toBe(false);
  });
});

describe("putuskanAkses", () => {
  it("halaman publik terbuka untuk tamu", () => {
    expect(putuskanAkses("/", undefined)).toBe("izinkan");
    expect(putuskanAkses("/login", undefined)).toBe("izinkan");
    expect(putuskanAkses("/akses-ditolak", undefined)).toBe("izinkan");
  });
  it("tamu diarahkan ke login untuk halaman terlindungi", () => {
    expect(putuskanAkses("/dashboard", undefined)).toBe("ke-login");
    expect(putuskanAkses("/travel/status", null)).toBe("ke-login");
  });
  it("pengguna yang sudah login dialihkan dari /login ke beranda", () => {
    expect(putuskanAkses("/login", "PENGGUNA")).toBe("ke-beranda");
  });
  it("dashboard terbuka untuk semua peran yang login", () => {
    for (const role of SEMUA_ROLE) expect(putuskanAkses("/dashboard", role)).toBe("izinkan");
  });
  it("setiap awalan rute hanya terbuka untuk peran yang ditentukan", () => {
    for (const { prefix, roles } of ROUTE_ACCESS) {
      for (const role of SEMUA_ROLE) {
        const harapan = roles.includes(role) ? "izinkan" : "ditolak";
        expect(putuskanAkses(prefix, role), `${role} → ${prefix}`).toBe(harapan);
        expect(putuskanAkses(`${prefix}/apa-saja`, role), `${role} → ${prefix}/apa-saja`).toBe(harapan);
      }
    }
  });
  it("tidak salah cocok pada awalan yang mirip (/memberx bukan /member)", () => {
    expect(putuskanAkses("/memberx", "PENGUNJUNG")).toBe("izinkan");
  });
});

describe("ROLE_LABEL", () => {
  it("memiliki label untuk setiap peran", () => {
    for (const role of SEMUA_ROLE) expect(ROLE_LABEL[role]).toBeTruthy();
  });
});
