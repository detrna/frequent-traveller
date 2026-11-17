import { expect, test } from "@playwright/test";
import { dengan, id } from "./db";
import { masuk } from "./helpers";

const TAHUN_INI = new Date(Date.now() + 7 * 3_600_000).getUTCFullYear();
const TAHUN_DEPAN = TAHUN_INI + 1; // bulan Maret tahun depan tidak pernah terisi seed acak

test.beforeAll(async () => {
  await dengan(async (q) => {
    await q(`DELETE FROM "Pegawai" WHERE nip = 'UJI-001'`);
    const pegawaiId = id();
    await q(`INSERT INTO "Pegawai" (id, nama, nip, jabatan, "jatahCutiTahunan") VALUES ($1, 'Uji Cuti Satu', 'UJI-001', 'Staf Uji', 12)`, [pegawaiId]);
    // permohonan: 27 Feb–2 Mar (4 hari, terpotong ke Maret = 2 hari) dan 10–12 Mar (3 hari)
    await q(`INSERT INTO "PermohonanCuti" (id, "pegawaiId", "tglMulai", "tglSelesai", "lamaHari", alasan) VALUES ($1,$2,$3,$4,4,'Liburan keluarga')`, [id(), pegawaiId, `${TAHUN_DEPAN}-02-27`, `${TAHUN_DEPAN}-03-02`]);
    await q(`INSERT INTO "PermohonanCuti" (id, "pegawaiId", "tglMulai", "tglSelesai", "lamaHari", alasan) VALUES ($1,$2,$3,$4,3,'Acara keluarga')`, [id(), pegawaiId, `${TAHUN_DEPAN}-03-10`, `${TAHUN_DEPAN}-03-12`]);
    // riwayat: tahun berjalan 3 + 2 = 5 hari, tahun lalu 4 hari (tidak dihitung)
    for (const [tahun, mulai, selesai, lama] of [
      [TAHUN_INI, `${TAHUN_INI}-01-12`, `${TAHUN_INI}-01-14`, 3],
      [TAHUN_INI, `${TAHUN_INI}-01-26`, `${TAHUN_INI}-01-27`, 2],
      [TAHUN_INI - 1, `${TAHUN_INI - 1}-06-03`, `${TAHUN_INI - 1}-06-06`, 4],
    ] as const) {
      await q(`INSERT INTO "RiwayatCuti" (id, "pegawaiId", tahun, "tglMulai", "tglSelesai", "lamaHari") VALUES ($1,$2,$3,$4,$5,$6)`, [id(), pegawaiId, tahun, mulai, selesai, lama]);
    }
  });
});

test.describe("HRD Manager — cuti pegawai (US1)", () => {
  test.beforeEach(async ({ page }) => masuk(page, "hrd@aps.test"));

  test("tanpa pilihan, halaman langsung menampilkan bulan berjalan", async ({ page }) => {
    await page.goto("/hrd/jadwal-cuti");
    await expect(page.getByRole("heading", { name: /^\d+ pegawai cuti pada [A-Za-z]+ \d{4}$/ })).toBeVisible();
  });

  test("US1-a: memilih tahun dan bulan menampilkan pegawai yang cuti beserta lamanya", async ({ page }) => {
    await page.goto("/hrd/jadwal-cuti");
    await page.getByLabel("Tahun").selectOption(String(TAHUN_DEPAN));
    await page.getByLabel("Bulan").selectOption("3");
    await page.getByRole("button", { name: "Tampilkan" }).click();

    await expect(page.getByRole("heading", { name: `1 pegawai cuti pada Maret ${TAHUN_DEPAN}` })).toBeVisible();
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(baris).toHaveCount(1); // satu baris per pegawai walau ada dua pengajuan
    await expect(baris.first()).toContainText("Uji Cuti Satu");
    await expect(baris.first()).toContainText("4 hari"); // lama pengajuan utuh
    await expect(baris.first()).toContainText("3 hari");
    await expect(baris.first().locator("td").last()).toHaveText("5 hari"); // 2 hari (1–2 Mar) + 3 hari (10–12 Mar)
  });

  test("US1-a: memilih tanggal mempersempit ke satu hari", async ({ page }) => {
    await page.goto(`/hrd/jadwal-cuti?tahun=${TAHUN_DEPAN}&bulan=3&tanggal=11`);
    await expect(page.getByRole("heading", { name: `1 pegawai cuti pada 11 Maret ${TAHUN_DEPAN}` })).toBeVisible();
    await expect(page.getByRole("table").locator("tbody tr").first().locator("td").last()).toHaveText("1 hari");

    await page.goto(`/hrd/jadwal-cuti?tahun=${TAHUN_DEPAN}&bulan=3&tanggal=20`);
    await expect(page.getByText("Tidak ada pegawai yang cuti pada periode ini.")).toBeVisible();
  });

  test("periode tidak valid (tahun/bulan kosong) menampilkan pesan kesalahan", async ({ page }) => {
    await page.goto("/hrd/jadwal-cuti?tahun=&bulan=");
    await expect(page.getByRole("alert").filter({ hasText: "Periode tidak valid" })).toBeVisible();
    await expect(page.getByText("Tahun wajib dipilih.")).toBeVisible();
    await expect(page.getByText("Bulan wajib dipilih.")).toBeVisible();

    await page.goto(`/hrd/jadwal-cuti?tahun=${TAHUN_DEPAN}&bulan=2&tanggal=30`);
    await expect(page.getByText("Tanggal tidak ada pada bulan yang dipilih.")).toBeVisible();
  });

  test("US1-b: pengajuan menampilkan nama, periode yang diajukan, dan lama cuti", async ({ page }) => {
    await page.goto("/hrd/pengajuan");
    await page.getByLabel("Tahun").selectOption(String(TAHUN_DEPAN));
    await page.getByLabel("Bulan").selectOption("3");
    await page.getByRole("button", { name: "Tampilkan" }).click();

    await expect(page.getByRole("heading", { name: `2 pengajuan pada Maret ${TAHUN_DEPAN}` })).toBeVisible();
    const baris = page.getByRole("table").locator("tbody tr");
    await expect(baris).toHaveCount(2);
    await expect(baris.first()).toContainText("Uji Cuti Satu");
    await expect(baris.first()).toContainText(/27 Feb\w* /);
    await expect(baris.first()).toContainText(/2 Mar\w* /);
    await expect(baris.first()).toContainText("4 hari");
    await expect(baris.first()).toContainText("Liburan keluarga");
    await expect(baris.nth(1)).toContainText("3 hari");
  });

  test("US1-c: memilih nama pegawai menampilkan riwayat dan sisa cuti tahun berjalan", async ({ page }) => {
    await page.goto("/hrd/riwayat");
    await page.getByLabel("Nama pegawai").selectOption({ label: "Uji Cuti Satu — Staf Uji" });
    await page.getByRole("button", { name: "Tampilkan riwayat" }).click();

    await expect(page.getByRole("heading", { name: "Uji Cuti Satu" })).toBeVisible();
    await expect(page.getByText("UJI-001")).toBeVisible();
    await expect(page.getByText("Jatah " + TAHUN_INI).locator("xpath=following-sibling::dd")).toHaveText("12 hari");
    await expect(page.getByText("Terpakai").locator("xpath=following-sibling::dd")).toHaveText("5 hari");
    await expect(page.getByText("Sisa cuti").locator("xpath=following-sibling::dd")).toHaveText("7 hari");
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(3); // termasuk riwayat tahun lalu
  });

  test("riwayat: pegawai tidak ditemukan menampilkan pesan kesalahan; tautan dari jadwal membuka riwayat", async ({ page }) => {
    await page.goto("/hrd/riwayat?pegawai=tidak-ada");
    await expect(page.getByRole("alert").filter({ hasText: "Pegawai tidak ditemukan." })).toBeVisible();

    await page.goto(`/hrd/jadwal-cuti?tahun=${TAHUN_DEPAN}&bulan=3`);
    await page.getByRole("link", { name: "Uji Cuti Satu" }).click();
    await expect(page).toHaveURL(/\/hrd\/riwayat\?pegawai=/);
    await expect(page.getByText("Sisa cuti", { exact: true })).toBeVisible();
  });
});

test.describe("kontrol akses cuti", () => {
  test("peran lain tidak dapat membuka halaman HRD, dan HRD tidak dapat memesan tiket", async ({ page }) => {
    await masuk(page, "member@aps.test");
    await page.goto("/hrd/jadwal-cuti");
    await expect(page).toHaveURL(/\/akses-ditolak$/);

    await page.context().clearCookies();
    await masuk(page, "hrd@aps.test");
    await page.goto("/penerbangan/cari");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
  });
});
