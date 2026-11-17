# Laporan SonarQube — Frequent Traveller (APS)

- Commit: `0c9ade2`
- SonarQube Community Build 26.11 (lokal, Docker), quality profile bawaan *Sonar way*
- Quality Gate: **OK**
- Cakupan analisis: `src/`, `prisma/`, `scripts/`, `tests/`, berkas konfigurasi di root (dikecualikan: `src/prisma/contract.*` hasil generate, `*.d.ts`, `node_modules`, `.next*`)

## Ringkasan metrik

| Metrik | Nilai |
|---|---|
| Bugs | 2 |
| Reliability rating | D |
| Vulnerabilities | 7 |
| Security rating | C |
| Security hotspots | 0 |
| Code smells | 2 |
| Maintainability rating | A |
| Duplikasi baris (%) | 0.0 |
| Blok duplikat | 0 |
| Baris kode (ncloc) | 6947 |
| Berkas | 133 |
| Fungsi | 883 |
| Cyclomatic complexity | 1430 |
| Cognitive complexity | 603 |
| Densitas komentar (%) | 4.5 |
| Technical debt | 0 jam 10 menit |

## Isu per tipe dan severity

| Tipe | Jumlah | Rincian severity |
|---|---|---|
| BUG | 2 | HIGH: 1, MEDIUM: 1 |
| VULNERABILITY | 7 | LOW: 3, MEDIUM: 4 |
| CODE_SMELL | 2 | HIGH: 2 |

## Aturan yang paling sering dilanggar

| Aturan | Tipe | Jumlah |
|---|---|---|
| `typescript:S4036` OS commands should not rely on PATH resolution | VULNERABILITY | 3 |
| `typescript:S2068` Credentials should not be hard-coded | VULNERABILITY | 3 |
| `typescript:S7767` Bitwise operators should not be used to truncate numbers | CODE_SMELL | 2 |
| `typescript:S2871` "Array.prototype.sort()" and "Array.prototype.toSorted()" should use a compare function | BUG | 1 |
| `typescript:S2137` Special identifiers should not be bound or assigned | BUG | 1 |
| `typescript:S2245` Pseudorandom number generators (PRNGs) should not be used in security contexts | VULNERABILITY | 1 |

## Berkas dengan isu terbanyak

| Berkas | Jumlah |
|---|---|
| `prisma/seed.ts` | 3 |
| `tests/e2e/global-setup.ts` | 2 |
| `tests/integration/helpers.ts` | 2 |
| `src/server/validation/penerbangan.ts` | 1 |
| `tests/global-setup.ts` | 1 |
| `src/app/error.tsx` | 1 |
| `tests/e2e/helpers.ts` | 1 |

## Daftar lengkap: Bugs (2)

| Severity | Lokasi | Pesan | Aturan |
|---|---|---|---|
| HIGH | `src/server/validation/penerbangan.ts:31` | Provide a compare function that depends on "String.localeCompare", to reliably sort elements alphabetically. | `typescript:S2871` |
| MEDIUM | `src/app/error.tsx:6` | Do not use "Error" to declare a function - use another name. | `typescript:S2137` |

## Daftar lengkap: Vulnerabilities (7)

| Severity | Lokasi | Pesan | Aturan |
|---|---|---|---|
| MEDIUM | `prisma/seed.ts:22` | Review this potentially hard-coded password. | `typescript:S2068` |
| MEDIUM | `tests/e2e/helpers.ts:3` | Review this potentially hard-coded password. | `typescript:S2068` |
| MEDIUM | `tests/integration/helpers.ts:62` | Review this potentially hard-coded password. | `typescript:S2068` |
| MEDIUM | `tests/integration/helpers.ts:114` | Make sure that using this pseudorandom number generator is safe here. | `typescript:S2245` |
| LOW | `tests/e2e/global-setup.ts:8` | Make sure the "PATH" variable only contains fixed, unwriteable directories. | `typescript:S4036` |
| LOW | `tests/e2e/global-setup.ts:9` | Make sure the "PATH" variable only contains fixed, unwriteable directories. | `typescript:S4036` |
| LOW | `tests/global-setup.ts:8` | Make sure the "PATH" variable only contains fixed, unwriteable directories. | `typescript:S4036` |

## Daftar lengkap: Code smells (2)

| Severity | Lokasi | Pesan | Aturan |
|---|---|---|---|
| HIGH | `prisma/seed.ts:30` | Use `Math.trunc` instead of `\|= 0`. | `typescript:S7767` |
| HIGH | `prisma/seed.ts:31` | Use `Math.trunc` instead of `\| 0`. | `typescript:S7767` |

## Security hotspots (0)

Tidak ada.

## Catatan analisis (tinjauan manual atas temuan)

| Temuan | Penilaian | Tindak lanjut yang disarankan |
|---|---|---|
| Bug `S2871` — `.sort()` tanpa compare function di `src/server/validation/penerbangan.ts:31` | **Positif palsu secara fungsional.** Yang diurutkan adalah string tanggal `YYYY-MM-DD`, dan urutan leksikografis bawaan sudah sama dengan urutan kronologis. | Opsional: `.sort((a, b) => a.localeCompare(b))` agar maksudnya eksplisit dan isu tertutup. |
| Bug `S2137` — komponen bernama `Error` di `src/app/error.tsx:6` | **Valid (keterbacaan).** Nama fungsi membayangi objek global `Error`. Tipe `Error` di parameter tetap merujuk ke tipe global, jadi tidak ada salah perilaku saat ini. | Ganti nama menjadi mis. `HalamanGalat` (Next.js hanya membutuhkan *default export*). |
| Code smell `S7767` — `\|= 0` / `\| 0` di `prisma/seed.ts:30-31` | **Positif palsu.** Ini PRNG `mulberry32` yang sengaja memakai `\| 0` untuk konversi ke integer 32-bit. `Math.trunc` **tidak** setara (tidak melakukan *wrap* 32-bit) dan akan merusak data seed yang deterministik. | Tandai *Won't fix / False positive* di SonarQube. |
| Vulnerability `S2068` — kata sandi tertulis di kode (`prisma/seed.ts`, `tests/*/helpers.ts`) | **Diterima.** Ini kata sandi akun demo/tes (`Demo#12345`) yang memang didokumentasikan di README. | Pastikan tidak dipakai untuk akun produksi nyata. |
| Vulnerability `S2245` — `Math.random()` di `tests/integration/helpers.ts:114` | **Diterima.** Hanya untuk membuat kode penerbangan acak di data tes, bukan konteks keamanan. | Tidak perlu. |
| Vulnerability `S4036` — perintah OS lewat `PATH` di `tests/global-setup.ts`, `tests/e2e/global-setup.ts` | **Diterima.** Setup tes menjalankan `npx prisma ...` di mesin pengembang/CI. | Tidak perlu. |

**Kesimpulan:** kode aplikasi produksi (`src/`) hanya memiliki 2 temuan, yaitu satu positif palsu dan satu masalah penamaan. Seluruh temuan *vulnerability* berada di seed dan tes. Tidak ada security hotspot, tidak ada duplikasi kode, dan maintainability rating **A** dengan technical debt sekitar 10 menit. Reliability rating D dan security rating C berasal dari temuan dengan severity tertinggi di atas, bukan dari jumlahnya.

## Cara menjalankan ulang

```bash
# 1. SonarQube lokal khusus APS (port 9001)
docker start aps-sonarqube || docker run -d --name aps-sonarqube -p 127.0.0.1:9001:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -v aps-sonarqube-data:/opt/sonarqube/data sonarqube:community

# 2. Scan (SONAR_TOKEN = token analisis proyek "aps" dari http://localhost:9001)
docker run --rm --network host -u "$(id -u):$(id -g)" -e SONAR_HOST_URL=http://localhost:9001 \
  -e SONAR_TOKEN=$SONAR_TOKEN -e SONAR_USER_HOME=/tmp/.sonar -v "$PWD:/usr/src" sonarsource/sonar-scanner-cli:latest \
  -Dsonar.projectKey=aps -Dsonar.projectVersion=$(git rev-parse --short HEAD) \
  -Dsonar.sources=src,prisma,scripts,tests,prisma.config.ts,next.config.ts,playwright.config.ts,vitest.config.mts,eslint.config.mjs \
  -Dsonar.exclusions="src/prisma/contract.*,**/*.d.ts" -Dsonar.working.directory=/tmp/.scannerwork -Dsonar.qualitygate.wait=true

# 3. Ekspor laporan ini (bagian "Catatan analisis" dan sesudahnya dipertahankan)
SONAR_ADMIN_PW='<kata-sandi-admin>' python3 dev/sonarcube/export-laporan.py
```

`sonarqube-raw.json` berisi data mentah (metrik, quality gate, semua isu, dan hotspot) dari API SonarQube.
