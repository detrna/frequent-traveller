import { expect, test, type Page } from "@playwright/test";
import { masuk, tanggalWIB } from "./helpers";

/** Membuka hasil pencarian CGK→`tujuan` pada hari ke-`hari` dan menekan "Pesan" pada penerbangan pertama. */
async function pesanPenerbanganPertama(page: Page, tujuan: string, hari: number) {
  await page.goto(`/penerbangan/cari?asal=CGK&tujuan=${tujuan}&tanggal=${tanggalWIB(hari)}`);
  await page.getByRole("link", { name: "Pesan", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Pemesanan Tiket" })).toBeVisible();
}

test.describe("Pengguna — memesan, membayar, dan membatalkan tiket (US2-b, US2-c)", () => {
  test.beforeEach(async ({ page }) => masuk(page, "pengguna@aps.test"));

  test("memesan tiket lalu menyelesaikan pembayaran simulasi", async ({ page }) => {
    await pesanPenerbanganPertama(page, "SUB", 12);
    await expect(page.getByLabel("Nama penumpang")).toHaveValue("Budi Santoso");
    await page.getByRole("button", { name: "Pesan tiket" }).click();

    await expect(page).toHaveURL(/\/pesanan\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Detail Pesanan" })).toBeVisible();
    await expect(page.getByText(/^[A-HJKMNP-Z2-9]{6}$/)).toBeVisible(); // kode booking
    await expect(page.getByText("booked", { exact: true })).toBeVisible();
    await expect(page.getByText("Terbit")).toBeVisible();

    await page.getByRole("button", { name: "Lanjut ke pembayaran" }).click();
    await expect(page.getByText("waiting for the payment", { exact: true })).toBeVisible();
    await expect(page.getByText("Pesanan menunggu pembayaran.")).toBeVisible();

    await page.getByRole("button", { name: "Bayar sekarang (simulasi)" }).click();
    await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
    await expect(page.getByText("Pembayaran berhasil.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Bayar sekarang|Lanjut ke pembayaran/ })).toHaveCount(0);
  });

  test("memesan penerbangan yang sama dua kali ditolak sebagai duplikat", async ({ page }) => {
    await pesanPenerbanganPertama(page, "UPG", 13);
    await page.getByRole("button", { name: "Pesan tiket" }).click();
    await expect(page).toHaveURL(/\/pesanan\/[^/]+$/);

    await pesanPenerbanganPertama(page, "UPG", 13);
    await page.getByRole("button", { name: "Pesan tiket" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /Pesanan untuk penerbangan ini sudah ada/ })).toBeVisible();
    await expect(page).toHaveURL(/\/pesanan\/baru/);
  });

  test("membatalkan pesanan lewat halaman konfirmasi", async ({ page }) => {
    await pesanPenerbanganPertama(page, "KNO", 14);
    await page.getByRole("button", { name: "Pesan tiket" }).click();
    await expect(page).toHaveURL(/\/pesanan\/(?!baru)[^/?]+$/);
    const urlDetail = page.url();

    await page.getByRole("link", { name: "Batalkan pesanan" }).click();
    await expect(page.getByRole("heading", { name: "Batalkan Pesanan" })).toBeVisible();
    // "Kembali" tidak membatalkan apa pun
    await page.getByRole("link", { name: "Kembali" }).click();
    await expect(page).toHaveURL(urlDetail);
    await expect(page.getByText("booked", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Batalkan pesanan" }).click();
    await page.getByRole("button", { name: "Ya, batalkan pesanan" }).click();
    await expect(page).toHaveURL(/info=dibatalkan/);
    await expect(page.getByText("Pesanan telah dibatalkan.")).toBeVisible();
    await expect(page.getByText("dibatalkan", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Batalkan pesanan" })).toHaveCount(0);

    // halaman konfirmasi untuk pesanan yang sudah dibatalkan tidak menawarkan pembatalan lagi
    await page.goto(`${urlDetail}/batal`);
    await expect(page.getByText("Pesanan ini sudah dibatalkan.")).toBeVisible();
  });

  test("daftar pesanan menampilkan pesanan contoh berikut statusnya", async ({ page }) => {
    await page.goto("/pesanan");
    for (const status of ["booked", "waiting for the payment", "confirmed", "dibatalkan"]) {
      await expect(page.getByText(status, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText("AP5T3K")).toBeVisible();
  });

  test("pesanan milik orang lain tidak dapat dibuka", async ({ page }) => {
    await page.goto("/pesanan/id-yang-tidak-ada");
    await expect(page.getByText(/404|could not be found|not found/i).first()).toBeVisible();
  });
});

test.describe("Member memesan", () => {
  test("nama penumpang terisi dari profil member", async ({ page }) => {
    await masuk(page, "member@aps.test");
    await pesanPenerbanganPertama(page, "DPS", 15);
    await expect(page.getByLabel("Nama penumpang")).toHaveValue("Citra Lestari Wijaya");
  });
});
