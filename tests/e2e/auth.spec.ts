import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "Demo#12345";

async function masuk(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test("tamu diarahkan ke halaman login dan kembali ke tujuan setelah masuk", async ({ page }) => {
  await page.goto("/travel/status");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Ftravel%2Fstatus/);
});

test("login berhasil menampilkan dashboard sesuai peran", async ({ page }) => {
  await masuk(page, "member@aps.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Halo, Citra Lestari" })).toBeVisible();
  await expect(page.getByText("Masuk sebagai Member Frequent Traveller.")).toBeVisible();
});

test("kredensial salah menampilkan pesan galat", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("member@aps.test");
  await page.getByLabel("Kata sandi").fill("salah-total");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email atau kata sandi salah." })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("peran yang salah diarahkan ke halaman akses ditolak", async ({ page }) => {
  await masuk(page, "pengunjung1@aps.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/travel/status");
  await expect(page).toHaveURL(/\/akses-ditolak$/);
  await expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible();
});

test("keluar mengakhiri sesi", async ({ page }) => {
  await masuk(page, "hrd@aps.test");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
});
