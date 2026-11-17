import type { Page } from "@playwright/test";

export const PASSWORD = "Demo#12345";

export async function masuk(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi").fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/dashboard$/);
}

/** Tanggal WIB (YYYY-MM-DD) `tambah` hari dari sekarang. */
export function tanggalWIB(tambah = 0): string {
  return new Date(Date.now() + 7 * 3_600_000 + tambah * 86_400_000).toISOString().slice(0, 10);
}
