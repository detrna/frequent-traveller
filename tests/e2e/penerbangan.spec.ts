import { expect, test } from "@playwright/test";
import { masuk, PASSWORD, tanggalWIB } from "./helpers";

const besok = tanggalWIB(1);
const lusa = tanggalWIB(2);

/** Label checkbox tanggal di /jadwal (format sama dengan tabel hasil). */
const formatTanggalPilihan = (t: string) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${t}T00:00:00+07:00`));

test.describe("Pengguna — cari penerbangan (US2-a, US3)", () => {
  test.beforeEach(async ({ page }) => masuk(page, "pengguna@aps.test"));

  test("mencari menurut tujuan dan tanggal menampilkan jadwal, maskapai, dan harga", async ({ page }) => {
    await page.goto("/jadwal");
    await page.getByLabel("Dari", { exact: true }).selectOption("CGK");
    await page.getByLabel("Tujuan").selectOption("DPS");
    await page.getByRole("checkbox", { name: formatTanggalPilihan(besok) }).check();
    await page.getByRole("button", { name: "Terapkan filter" }).click();

    await expect(page.getByRole("heading", { name: "2 penerbangan ditemukan" })).toBeVisible();
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(baris).toHaveCount(2);
    await expect(baris.first()).toContainText("Jakarta (CGK)");
    await expect(baris.first()).toContainText("Denpasar (DPS)");
    await expect(baris.first()).toContainText(/Rp\s?[\d.]+/);
  });

  test("tanggal di masa lalu ditolak dengan pesan galat", async ({ page }) => {
    await page.goto(`/jadwal?tujuan=DPS&tanggal=${tanggalWIB(-3)}`);
    await expect(page.getByText("Tanggal tidak boleh di masa lalu.")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("tanpa filter /jadwal menampilkan semua penerbangan, per halaman", async ({ page }) => {
    await page.goto("/jadwal");
    await expect(page.getByRole("heading", { name: /penerbangan tersedia/ })).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(20);
    await expect(page.getByText(/Halaman 1 dari \d+/)).toBeVisible();

    await page.getByRole("link", { name: "Berikutnya" }).click();
    await expect(page).toHaveURL(/halaman=2/);
    await expect(page.getByText(/Halaman 2 dari \d+/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Sebelumnya" })).toBeVisible();
  });

  test("beberapa tanggal dapat dipilih sekaligus", async ({ page }) => {
    await page.goto("/jadwal");
    await page.getByLabel("Dari", { exact: true }).selectOption("CGK");
    await page.getByLabel("Tujuan").selectOption("DPS");
    await page.getByRole("checkbox", { name: formatTanggalPilihan(besok) }).check();
    await page.getByRole("checkbox", { name: formatTanggalPilihan(lusa) }).check();
    await page.getByRole("button", { name: "Terapkan filter" }).click();

    await expect(page).toHaveURL(new RegExp(`tanggal=${besok}&tanggal=${lusa}`));
    await expect(page.getByRole("checkbox", { name: formatTanggalPilihan(besok) })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: formatTanggalPilihan(lusa) })).toBeChecked();
    const satuTanggal = page.getByRole("table").locator("tbody tr");
    await expect(satuTanggal.first()).toBeVisible();
    // dua hari → lebih banyak daripada satu hari (2 penerbangan CGK→DPS per hari)
    await expect(page.getByRole("heading", { name: "4 penerbangan ditemukan" })).toBeVisible();
  });

  test("tidak ada penerbangan → pesan kosong", async ({ page }) => {
    await page.goto(`/jadwal?asal=DPS&tujuan=MDC&tanggal=${besok}`);
    await expect(page.getByText("Tidak ada penerbangan yang sesuai.")).toBeVisible();
  });

  test("beberapa tujuan dikelompokkan per tujuan", async ({ page }) => {
    await page.goto("/jadwal/multi-tujuan");
    await page.getByLabel("Dari (opsional)").selectOption("CGK");
    await page.getByLabel("Tanggal").fill(besok);
    await page.getByLabel(/^Denpasar/).check();
    await page.getByLabel(/^Surabaya/).check();
    await page.getByRole("button", { name: "Cari semua tujuan" }).click();

    await expect(page.getByRole("heading", { name: /Denpasar \(DPS\) · 2 penerbangan/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Surabaya \(SUB\) · 2 penerbangan/ })).toBeVisible();
  });

  test("tanpa memilih tujuan menampilkan galat", async ({ page }) => {
    await page.goto(`/jadwal/multi-tujuan?cari=1&tanggal=${besok}`);
    await expect(page.getByRole("alert").filter({ hasText: "Pilih minimal satu tujuan." })).toBeVisible();
  });

  test("fitur member tidak dapat dibuka oleh Pengguna biasa", async ({ page }) => {
    await page.goto("/member/preferensi");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
  });
});

test.describe("Member — preferensi, perbandingan, multi-destinasi (US4, US6)", () => {
  test.beforeEach(async ({ page }) => masuk(page, "member@aps.test"));

  test("preferensi jam keberangkatan menyaring hasil", async ({ page }) => {
    await page.goto(`/member/preferensi?asal=CGK&tujuan=DPS&tanggal=${besok}&jamMulai=12&jamSelesai=23`);
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(baris).toHaveCount(1); // slot sore saja
    const jam = await baris.first().locator("td").nth(2).innerText();
    const mulai = Number(jam.match(/(\d{2}):\d{2} –/)?.[1]);
    expect(mulai).toBeGreaterThanOrEqual(12);
  });

  test("rentang jam terbalik ditolak", async ({ page }) => {
    await page.goto(`/member/preferensi?tujuan=DPS&tanggal=${besok}&jamMulai=20&jamSelesai=8`);
    await expect(page.getByText("Jam mulai tidak boleh setelah jam selesai.")).toBeVisible();
  });

  test("perbandingan harga mengurutkan dari termurah dan menandainya", async ({ page }) => {
    await page.goto(`/member/bandingkan?asal=CGK&tujuan=DPS&tanggal=${besok}`);
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(baris).toHaveCount(2);
    await expect(baris.first()).toContainText("Termurah");
    await expect(baris.nth(1)).toContainText("+Rp");
    await expect(page.getByText("Rata-rata")).toBeVisible();
  });

  test("multi-destinasi: tambah ruas lewat form, lalu lihat total harga dan jumlah penerbangan", async ({ page }) => {
    await page.goto("/member/multi-destinasi");
    await expect(page.getByRole("heading", { name: "Penerbangan 1" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Penerbangan 2" })).toBeVisible();

    const asal = page.getByLabel("Lokasi keberangkatan");
    const tujuan = page.getByLabel("Tujuan", { exact: true });
    const tanggal = page.getByLabel("Tanggal");
    await asal.nth(0).selectOption("CGK");
    await tujuan.nth(0).selectOption("DPS");
    await tanggal.nth(0).fill(besok);
    await asal.nth(1).selectOption("DPS");
    await tujuan.nth(1).selectOption("SUB");
    await tanggal.nth(1).fill(lusa);

    await page.getByRole("button", { name: "+ Tambah penerbangan" }).click();
    await expect(page.getByRole("heading", { name: "Penerbangan 3" })).toBeVisible();
    await page.getByRole("button", { name: "Hapus penerbangan 3" }).click();
    await expect(page.getByRole("heading", { name: "Penerbangan 3" })).toHaveCount(0);

    await page.getByRole("button", { name: "Cari multi-destinasi" }).click();
    await expect(page.getByText("Total harga termurah")).toBeVisible();
    await expect(page.getByText("2 dari 2 ruas")).toBeVisible();
    await expect(page.getByRole("heading", { name: /1\. CGK → DPS/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /2\. DPS → SUB/ })).toBeVisible();
  });

  test("multi-destinasi dengan satu ruas ditolak", async ({ page }) => {
    await page.goto(`/member/multi-destinasi?cari=1&asal=CGK&tujuan=DPS&tanggal=${besok}`);
    await expect(page.getByRole("alert").filter({ hasText: "minimal dua ruas penerbangan" })).toBeVisible();
  });
});

test.describe("Tamu — jadwal penerbangan publik (US10)", () => {
  test("tamu dapat mencari jadwal tanpa login dan melihat tautan masuk untuk memesan", async ({ page }) => {
    await page.goto(`/jadwal?asal=CGK&tujuan=DPS&tanggal=${besok}`);
    await expect(page).toHaveURL(/\/jadwal\?/);
    await expect(page.getByRole("heading", { name: "2 penerbangan ditemukan" })).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr").first()).toContainText(/Rp\s?[\d.]+/);
    await expect(page.getByRole("link", { name: "Pesan", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Masuk untuk memesan" }).first()).toBeVisible();
  });

  test("beberapa tujuan juga terbuka untuk tamu", async ({ page }) => {
    await page.goto(`/jadwal/multi-tujuan?cari=1&asal=CGK&tanggal=${besok}&tujuan=DPS&tujuan=SUB`);
    await expect(page.getByRole("heading", { name: /Denpasar \(DPS\) · 2 penerbangan/ })).toBeVisible();
  });

  test("memesan sebagai tamu → login → kembali ke formulir pemesanan penerbangan itu", async ({ page }) => {
    await page.goto(`/jadwal?asal=CGK&tujuan=DPS&tanggal=${besok}`);
    await page.getByRole("link", { name: "Masuk untuk memesan" }).first().click();
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fpesanan%2Fbaru%3Fpenerbangan%3D/);

    await page.getByLabel("Email").fill("pengguna@aps.test");
    await page.getByLabel("Kata sandi").fill(PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/pesanan\/baru\?penerbangan=/);
    await expect(page.getByRole("heading", { name: "Pemesanan Tiket" })).toBeVisible();
  });

  test("halaman pemesanan tetap butuh login", async ({ page }) => {
    await page.goto("/pesanan/baru?penerbangan=apa-saja");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });

  test("tautan lama /penerbangan/cari dialihkan ke /jadwal dengan query yang sama", async ({ page }) => {
    await page.goto(`/penerbangan/cari?tujuan=DPS&tanggal=${besok}`);
    await expect(page).toHaveURL(new RegExp(`/jadwal\\?tujuan=DPS&tanggal=${besok}`));
  });

  test("HRD yang login dapat melihat jadwal tetapi tanpa tombol pesan", async ({ page }) => {
    await masuk(page, "hrd@aps.test");
    await page.goto(`/jadwal?asal=CGK&tujuan=DPS&tanggal=${besok}`);
    await expect(page.getByRole("heading", { name: "2 penerbangan ditemukan" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: /Pesan|memesan/ })).toHaveCount(0);
  });
});
