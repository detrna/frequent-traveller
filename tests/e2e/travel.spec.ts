import { expect, test, type APIRequestContext } from "@playwright/test";
import { masuk, PASSWORD, tanggalWIB } from "./helpers";

const MAILPIT = "http://localhost:8025";

async function pesanMailpit(request: APIRequestContext, penerima: string) {
  const respons = await request.get(`${MAILPIT}/api/v1/search`, { params: { query: `to:${penerima}` } });
  expect(respons.ok(), "Mailpit harus berjalan (npm run db:up)").toBe(true);
  const { messages } = (await respons.json()) as { messages: Array<{ ID: string; Subject: string }> };
  return messages;
}

async function isiPesan(request: APIRequestContext, id: string) {
  const respons = await request.get(`${MAILPIT}/api/v1/message/${id}`);
  return (await respons.json()) as { Text: string; HTML: string; Subject: string };
}

test.describe("US7 — status booking dan filter", () => {
  test.beforeEach(async ({ page }) => masuk(page, "travel@aps.test"));

  test("menampilkan semua status, lalu memfilter confirmed / booked / waiting for the payment", async ({ page }) => {
    await page.goto("/travel/status");
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(page.getByRole("link", { name: /^Semua \(\d+\)$/ })).toHaveAttribute("aria-current", "page");
    // semua status contoh hadir pada tampilan "Semua"
    for (const status of ["confirmed", "booked", "waiting for the payment", "dibatalkan"]) {
      await expect(baris.getByText(status, { exact: true }).first()).toBeVisible();
    }

    for (const [tab, badge, lainnya] of [
      [/^confirmed \(\d+\)$/, "confirmed", ["booked", "waiting for the payment", "dibatalkan"]],
      [/^booked \(\d+\)$/, "booked", ["confirmed", "waiting for the payment", "dibatalkan"]],
      [/^waiting for the payment \(\d+\)$/, "waiting for the payment", ["confirmed", "booked", "dibatalkan"]],
    ] as const) {
      await page.getByRole("link", { name: tab }).click();
      await expect(page.getByRole("link", { name: tab })).toHaveAttribute("aria-current", "page");
      const jumlah = await baris.count();
      expect(jumlah).toBeGreaterThan(0);
      await expect(baris.getByText(badge, { exact: true })).toHaveCount(jumlah); // setiap baris berstatus itu
      for (const lain of lainnya) await expect(baris.getByText(lain, { exact: true })).toHaveCount(0);
    }
  });

  test("filter yang tidak dikenal menampilkan galat tetapi tetap menampilkan semua booking", async ({ page }) => {
    await page.goto("/travel/status?status=dibatalkan");
    await expect(page.getByRole("alert").filter({ hasText: "Status tidak dikenal." })).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr").first()).toBeVisible();
  });
});

test.describe("US9 — otorisasi tiket dengan kode booking reference", () => {
  test.beforeEach(async ({ page }) => masuk(page, "travel@aps.test"));

  test("kode yang sesuai menampilkan status booking", async ({ page }) => {
    await page.goto("/travel/otorisasi");
    await page.getByLabel("Kode booking reference").fill("  ap9c4n ");
    await page.getByRole("button", { name: "Periksa kode" }).click();
    await expect(page.getByRole("heading", { name: "Status booking" })).toBeVisible();
    await expect(page.getByText("AP9C4N", { exact: true })).toBeVisible();
    await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  });

  test("kode yang tidak sesuai: pesan wajib ditampilkan dan manajer diminta mengulang input", async ({ page }) => {
    await page.goto("/travel/otorisasi");
    await page.getByLabel("Kode booking reference").fill("ZZZZZZ");
    await page.getByRole("button", { name: "Periksa kode" }).click();

    const pesan = page.getByRole("alert").filter({ hasText: "kode booking reference tidak sesuai" });
    await expect(pesan).toHaveText("kode booking reference tidak sesuai");
    await expect(page.getByText("Silakan ulangi input kode booking reference.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Status booking" })).toHaveCount(0);

    // mengulang input dengan kode yang benar
    await expect(page.getByLabel("Kode booking reference")).toBeFocused();
    await page.getByLabel("Kode booking reference").fill("AP5T3K");
    await page.getByRole("button", { name: "Periksa kode" }).click();
    await expect(page.getByRole("heading", { name: "Status booking" })).toBeVisible();
    await expect(page.getByText("booked", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "tidak sesuai" })).toHaveCount(0);
  });
});

test.describe("US8 — mencari dan memesan tiket untuk pengunjung", () => {
  test("alur lengkap: cari tiket, pesan atas nama pengunjung baru, e-tiket diterima, pengunjung melihat tiketnya", async ({ page, browser, request }) => {
    const email = `tamu${Date.now()}@aps.test`;
    await masuk(page, "travel@aps.test");

    // US8-a: mencari tiket
    await page.goto(`/travel/cari?asal=CGK&tujuan=SUB&tanggal=${tanggalWIB(20)}`);
    await expect(page.getByRole("heading", { name: "2 tiket ditemukan" })).toBeVisible();
    await page.getByRole("link", { name: "Pesan untuk pengunjung" }).first().click();
    await expect(page.getByRole("heading", { name: "Pesan untuk Pengunjung" })).toBeVisible();

    // data tidak lengkap ditolak per kolom
    await page.getByLabel("Nama pengunjung").fill("Tamu Baru");
    await page.getByLabel("Email pengunjung").fill(email);
    await page.getByLabel("Nomor telepon").fill("123");
    await page.getByRole("button", { name: "Pesan tiket untuk pengunjung" }).click();
    await expect(page.getByText("Nomor telepon tidak valid. Contoh: 081234567890.")).toBeVisible();
    await expect(page.getByText("NIK pengunjung wajib diisi.").or(page.getByText("NIK harus 16 digit angka."))).toBeVisible();
    await expect(page.getByLabel("Nama pengunjung")).toHaveValue("Tamu Baru"); // isian tidak hilang

    // US8-b: data lengkap → booking tersimpan atas nama pengunjung
    await page.getByLabel("Nomor telepon").fill("0813 5555 0001");
    await page.getByLabel("NIK").fill("3578015505950001");
    await page.getByRole("button", { name: "Pesan tiket untuk pengunjung" }).click();
    await expect(page.getByText("Pesanan berhasil disimpan atas nama Tamu Baru.")).toBeVisible();
    const kode = (await page.locator("dd.font-mono").first().innerText()).trim();
    expect(kode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    await expect(page.getByText(`E-tiket telah dikirim ke ${email}.`)).toBeVisible();
    const sandi = (await page.locator("code").first().innerText()).trim();
    expect(sandi).toHaveLength(12);

    // US8-d: e-tiket benar-benar sampai di kotak masuk (Mailpit)
    await expect.poll(async () => (await pesanMailpit(request, email)).length).toBe(1);
    const [surat] = await pesanMailpit(request, email);
    expect(surat.Subject).toMatch(/^E-tiket APS TKT-/);
    const isi = await isiPesan(request, surat.ID);
    expect(isi.Text).toContain(kode);
    expect(isi.Text).toContain("Jakarta (CGK) → Surabaya (SUB)");

    // US8-c: pengunjung login dengan kata sandi sementara dan melihat tiketnya
    const konteks = await browser.newContext({ baseURL: page.url().split("/travel")[0] });
    const halamanPengunjung = await konteks.newPage();
    await halamanPengunjung.goto("/login");
    await halamanPengunjung.getByLabel("Email").fill(email);
    await halamanPengunjung.getByLabel("Kata sandi").fill(sandi);
    await halamanPengunjung.getByRole("button", { name: "Masuk" }).click();
    await halamanPengunjung.waitForURL(/\/dashboard$/);
    await halamanPengunjung.goto("/pengunjung/tiket");
    await expect(halamanPengunjung.getByRole("heading", { name: "Tiket Saya" })).toBeVisible();
    await expect(halamanPengunjung.getByText(kode, { exact: true })).toBeVisible();
    await expect(halamanPengunjung.getByRole("main").getByText("Tamu Baru")).toBeVisible();
    await konteks.close();
  });

  test("pengunjung contoh melihat tiket yang dipesankan atas namanya", async ({ page }) => {
    await masuk(page, "pengunjung1@aps.test");
    await page.goto("/pengunjung/tiket");
    await expect(page.getByText("AP8H2T", { exact: true })).toBeVisible();
    await expect(page.getByRole("main").getByText("Fajar Hidayat")).toBeVisible();
    await expect(page.getByText("AP4J9V")).toHaveCount(0); // milik pengunjung lain
  });

  test("e-tiket yang gagal dikirim dapat dikirim ulang dari detail booking", async ({ page, request }) => {
    const sebelum = (await pesanMailpit(request, "pengunjung2@aps.test")).length;
    await masuk(page, "travel@aps.test");
    await page.goto("/travel/otorisasi?kode=AP4J9V");
    await page.getByRole("link", { name: "Lihat detail & e-tiket" }).click();

    await expect(page.getByText("Contoh: SMTP tidak dapat dihubungi")).toBeVisible();
    await expect(page.getByText("Gagal", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kirim ulang e-tiket" }).click();

    await expect(page.getByText("E-tiket berhasil dikirim.")).toBeVisible();
    await expect(page.getByText("Terkirim", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Kirim ulang e-tiket|Kirim e-tiket/ })).toHaveCount(0);
    await expect.poll(async () => (await pesanMailpit(request, "pengunjung2@aps.test")).length).toBe(sebelum + 1);
  });
});

test.describe("kontrol akses peran", () => {
  test("Pengunjung tidak dapat membuka halaman Manager Travel, dan sebaliknya", async ({ page }) => {
    await masuk(page, "pengunjung1@aps.test");
    await page.goto("/travel/status");
    await expect(page).toHaveURL(/\/akses-ditolak$/);

    await page.context().clearCookies();
    await masuk(page, "travel@aps.test");
    await page.goto("/pesanan");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
    await page.goto("/pengunjung/tiket");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
  });
});

test("kata sandi demo tetap sama untuk semua akun contoh", () => {
  expect(PASSWORD).toBe("Demo#12345");
});
