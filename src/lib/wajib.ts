/**
 * Prisma 8 mengetik relasi to-one yang di-include lewat callback sebagai `T | null`, walau kunci asingnya wajib.
 * Fungsi ini menegaskan integritas itu di satu tempat (service), sehingga halaman memakai tipe non-null.
 */
export function wajib<T>(nilai: T | null | undefined, apa: string): T {
  if (nilai === null || nilai === undefined) {
    throw new Error(`Integritas data dilanggar: ${apa} tidak ditemukan.`);
  }
  return nilai;
}
