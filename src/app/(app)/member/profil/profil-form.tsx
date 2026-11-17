"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { simpanProfilAction, type ProfilState } from "./actions";

export type NilaiProfil = Record<"namaLengkap" | "tglLahir" | "nik" | "noPaspor" | "telepon" | "kewarganegaraan" | "alamat", string>;

export function ProfilForm({ awal, hariIni }: { awal: NilaiProfil; hariIni: string }) {
  const [state, formAction, pending] = useActionState<ProfilState, FormData>(simpanProfilAction, {});
  const nilai = { ...awal, ...state.nilai };
  const galat = state.galat ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.tersimpan ? <Alert tone="success">Data profil berhasil disimpan.</Alert> : null}
      {state.pesanGalat ? <Alert tone="error">{state.pesanGalat}</Alert> : null}
      {Object.keys(galat).length > 0 ? <Alert tone="error">Periksa kembali isian yang ditandai.</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" name="namaLengkap" defaultValue={nilai.namaLengkap} error={galat.namaLengkap} autoComplete="name" hint="Sesuai KTP/paspor." />
        <Field label="Tanggal lahir" name="tglLahir" type="date" max={hariIni} defaultValue={nilai.tglLahir} error={galat.tglLahir} autoComplete="bday" />
        <Field label="NIK" name="nik" inputMode="numeric" defaultValue={nilai.nik} error={galat.nik} hint="16 digit angka." />
        <Field label="Nomor paspor" name="noPaspor" defaultValue={nilai.noPaspor} error={galat.noPaspor} autoCapitalize="characters" />
        <Field label="Nomor telepon" name="telepon" type="tel" inputMode="tel" defaultValue={nilai.telepon} error={galat.telepon} autoComplete="tel" hint="Contoh: 081234567890." />
        <Field label="Kewarganegaraan" name="kewarganegaraan" defaultValue={nilai.kewarganegaraan} error={galat.kewarganegaraan} autoComplete="country-name" />
      </div>
      <Field label="Alamat" name="alamat" defaultValue={nilai.alamat} error={galat.alamat} autoComplete="street-address" />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan profil"}
      </Button>
    </form>
  );
}
