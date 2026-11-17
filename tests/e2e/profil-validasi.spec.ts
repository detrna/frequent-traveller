import { expect, test } from "@playwright/test";
import { masuk } from "./helpers";

test.describe("US5 — profil dan validasi tiket", () => {
  test("profil tidak lengkap: validasi ditolak dengan pesan wajib, lalu berhasil setelah profil dilengkapi", async ({ page }) => {
    await masuk(page, "member2@aps.test"); // profil kosong, punya tiket berstatus terbit

    // US5-c: ditolak dengan pesan persis "data profil tidak lengkap"
    await page.goto("/member/validasi");
    await page.getByRole("button", { name: "Validasi tiket" }).click();
    const galat = page.getByRole("alert").filter({ hasText: "data profil tidak lengkap" });
    await expect(galat).toBeVisible();
    await expect(galat).toHaveText(/^data profil tidak lengkap/);
    await expect(page.getByRole("link", { name: "Lengkapi profil" })).toBeVisible();
    await expect(page.getByText("Tiket: Terbit")).toBeVisible(); // tidak berubah

    // US5-a: melengkapi profil
    await page.getByRole("link", { name: "Lengkapi profil" }).click();
    await expect(page.getByText(/Data profil belum lengkap\. Belum terisi: Nama lengkap, Tanggal lahir/)).toBeVisible();
    await page.getByLabel("Nama lengkap").fill("Dimas Prasetyo Utama");
    await page.getByLabel("Tanggal lahir").fill("1995-03-21");
    await page.getByLabel("NIK").fill("3578012103950002");
    await page.getByLabel("Nomor paspor").fill("b7654321");
    await page.getByLabel("Nomor telepon").fill("0857-1234-5678");
    await page.getByLabel("Kewarganegaraan").fill("Indonesia");
    await page.getByLabel("Alamat").fill("Jl. Kenanga No. 5, Surabaya");
    await page.getByRole("button", { name: "Simpan profil" }).click();
    await expect(page.getByText("Data profil berhasil disimpan.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Data profil lengkap. Anda dapat memvalidasi tiket.")).toBeVisible();
    await expect(page.getByLabel("Nomor paspor")).toHaveValue("B7654321");
    await expect(page.getByLabel("Nomor telepon")).toHaveValue("085712345678");

    // US5-b: sekarang validasi berhasil
    await page.goto("/member/validasi");
    await page.getByRole("button", { name: "Validasi tiket" }).click();
    await expect(page.getByText(/Tiket TKT-.+ berhasil divalidasi\./)).toBeVisible();
    await expect(page.getByText(/Tervalidasi pada/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Validasi tiket" })).toHaveCount(0);
  });

  test("member dengan profil lengkap langsung dapat memvalidasi tiket", async ({ page }) => {
    await masuk(page, "member@aps.test");
    await page.goto("/member/validasi");
    await expect(page.getByText("Tervalidasi pada").first()).toBeVisible(); // tiket contoh AP4F7R
    await page.getByRole("button", { name: "Validasi tiket" }).first().click();
    await expect(page.getByText(/berhasil divalidasi\./)).toBeVisible();
  });

  test("isian profil yang salah ditolak per kolom dan tidak disimpan", async ({ page }) => {
    await masuk(page, "member@aps.test");
    await page.goto("/member/profil");
    await page.getByLabel("NIK").fill("123");
    await page.getByLabel("Nomor telepon").fill("12345");
    await page.getByRole("button", { name: "Simpan profil" }).click();

    await expect(page.getByText("NIK harus 16 digit angka.")).toBeVisible();
    await expect(page.getByText("Nomor telepon tidak valid. Contoh: 081234567890.")).toBeVisible();
    await expect(page.getByLabel("NIK")).toHaveValue("123"); // isian tidak hilang

    await page.reload();
    await expect(page.getByLabel("NIK")).toHaveValue("3174015705920001"); // nilai tersimpan tidak berubah
  });

  test("Pengguna biasa tidak dapat membuka halaman profil/validasi", async ({ page }) => {
    await masuk(page, "pengguna@aps.test");
    await page.goto("/member/validasi");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
  });
});
