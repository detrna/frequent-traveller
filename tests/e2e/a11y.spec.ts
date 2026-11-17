import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { masuk, tanggalWIB } from "./helpers";

/** Gagal bila ada pelanggaran aksesibilitas tingkat serious/critical (WCAG 2.x A/AA). */
async function periksa(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const hasil = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(hasil.passes.length, `axe tidak menganalisis ${url}`).toBeGreaterThan(0);
  const berat = hasil.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    berat.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
    `Pelanggaran aksesibilitas di ${url}`,
  ).toEqual([]);
}

const besok = tanggalWIB(1);

test("halaman login", async ({ page }) => {
  await periksa(page, "/login");
});

test("Pengguna", async ({ page }) => {
  await masuk(page, "pengguna@aps.test");
  for (const url of ["/dashboard", `/penerbangan/cari?asal=CGK&tujuan=DPS&tanggal=${besok}`, "/penerbangan/multi-tujuan", "/pesanan"]) await periksa(page, url);
});

test("Member", async ({ page }) => {
  await masuk(page, "member@aps.test");
  for (const url of [
    "/member/profil",
    "/member/validasi",
    `/member/preferensi?tujuan=DPS&tanggal=${besok}`,
    `/member/bandingkan?asal=CGK&tujuan=DPS&tanggal=${besok}`,
    `/member/multi-destinasi?cari=1&asal=CGK&tujuan=DPS&tanggal=${besok}&asal=DPS&tujuan=SUB&tanggal=${tanggalWIB(2)}`,
  ]) await periksa(page, url);
});

test("Manager Travel", async ({ page }) => {
  await masuk(page, "travel@aps.test");
  for (const url of ["/travel/status", "/travel/status?status=booked", "/travel/otorisasi?kode=ZZZZZZ", "/travel/otorisasi?kode=AP9C4N", `/travel/cari?tujuan=DPS&tanggal=${besok}`]) await periksa(page, url);
});

test("HRD Manager", async ({ page }) => {
  await masuk(page, "hrd@aps.test");
  for (const url of ["/hrd/jadwal-cuti", "/hrd/pengajuan", "/hrd/riwayat"]) await periksa(page, url);
});

test("Pengunjung", async ({ page }) => {
  await masuk(page, "pengunjung1@aps.test");
  await periksa(page, "/pengunjung/tiket");
});
