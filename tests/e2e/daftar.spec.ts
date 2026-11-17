import { expect, test } from "@playwright/test";
import { masuk } from "./helpers";

const unik = () => `baru-${Date.now()}-${Math.floor(Math.random() * 1e6)}@aps.test`;

test.describe("Tamu — mendaftar akun (US10-b)", () => {
  test("mendaftar membuat akun Pengguna dan langsung masuk ke dashboard", async ({ page }) => {
    await page.goto("/daftar");
    await page.getByLabel("Nama").fill("Rina Marlina");
    await page.getByLabel("Email").fill(unik());
    await page.getByLabel("Kata sandi", { exact: true }).fill("RahasiaKu#1");
    await page.getByLabel("Konfirmasi kata sandi").fill("RahasiaKu#1");
    await page.getByRole("button", { name: "Daftar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Halo, Rina Marlina" })).toBeVisible();
    await expect(page.getByText("Masuk sebagai Pengguna.")).toBeVisible();
  });

  test("email yang sudah terdaftar ditolak dan isian nama/email tetap terisi", async ({ page }) => {
    await page.goto("/daftar");
    await page.getByLabel("Nama").fill("Budi Dua");
    await page.getByLabel("Email").fill("pengguna@aps.test");
    await page.getByLabel("Kata sandi", { exact: true }).fill("RahasiaKu#1");
    await page.getByLabel("Konfirmasi kata sandi").fill("RahasiaKu#1");
    await page.getByRole("button", { name: "Daftar" }).click();

    await expect(page.getByText("Email sudah terdaftar.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("pengguna@aps.test");
    await expect(page).toHaveURL(/\/daftar$/);
  });

  test("konfirmasi kata sandi yang berbeda ditolak", async ({ page }) => {
    await page.goto("/daftar");
    await page.getByLabel("Nama").fill("Rina Marlina");
    await page.getByLabel("Email").fill(unik());
    await page.getByLabel("Kata sandi", { exact: true }).fill("RahasiaKu#1");
    await page.getByLabel("Konfirmasi kata sandi").fill("Berbeda#123");
    await page.getByRole("button", { name: "Daftar" }).click();
    await expect(page.getByText("Konfirmasi kata sandi tidak cocok.")).toBeVisible();
  });

  test("daftar dari 'Masuk untuk memesan' melanjutkan ke formulir pemesanan", async ({ page }) => {
    const callback = encodeURIComponent("/pesanan/baru?penerbangan=apa-saja");
    await page.goto(`/login?callbackUrl=${callback}`);
    await page.getByRole("link", { name: "Daftar" }).click();
    await expect(page).toHaveURL(/\/daftar\?callbackUrl=/);

    await page.getByLabel("Nama").fill("Rina Marlina");
    await page.getByLabel("Email").fill(unik());
    await page.getByLabel("Kata sandi", { exact: true }).fill("RahasiaKu#1");
    await page.getByLabel("Konfirmasi kata sandi").fill("RahasiaKu#1");
    await page.getByRole("button", { name: "Daftar" }).click();
    await expect(page).toHaveURL(/\/pesanan\/baru\?penerbangan=apa-saja/);
  });

  test("pengguna yang sudah login dialihkan dari /daftar ke dashboard", async ({ page }) => {
    await masuk(page, "pengguna@aps.test");
    await page.goto("/daftar");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
