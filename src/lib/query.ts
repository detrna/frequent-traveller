export type SearchParams = Record<string, string | string[] | undefined>;

/** Nilai pertama dari sebuah parameter query ("" bila tidak ada). */
export function ambilSatu(sp: SearchParams, kunci: string): string {
  const nilai = sp[kunci];
  return (Array.isArray(nilai) ? nilai[0] : nilai) ?? "";
}

/** Semua nilai dari parameter yang boleh berulang (?a=1&a=2). */
export function ambilBanyak(sp: SearchParams, kunci: string): string[] {
  const nilai = sp[kunci];
  if (nilai === undefined) return [];
  return Array.isArray(nilai) ? nilai : [nilai];
}

/** Apakah form pencarian sudah dikirim (minimal salah satu kunci ada di query). */
export function adaParameter(sp: SearchParams, ...kunci: string[]): boolean {
  return kunci.some((k) => sp[k] !== undefined);
}
