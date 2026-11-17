import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Card, PageHeader } from "@/components/ui/card";
import { tanggalWIB } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { ambilProfil, kolomBelumLengkap, LABEL_KOLOM_PROFIL } from "@/server/services/profil";
import { ProfilForm, type NilaiProfil } from "./profil-form";

export const metadata: Metadata = { title: "Profil Member" };

export default async function ProfilPage() {
  const member = await wajibBisa("member.fitur");
  const profil = await ambilProfil(member.id);
  const kurang = kolomBelumLengkap(profil);

  const awal: NilaiProfil = {
    namaLengkap: profil?.namaLengkap ?? "",
    tglLahir: profil?.tglLahir ? profil.tglLahir.toISOString().slice(0, 10) : "",
    nik: profil?.nik ?? "",
    noPaspor: profil?.noPaspor ?? "",
    telepon: profil?.telepon ?? "",
    kewarganegaraan: profil?.kewarganegaraan ?? "",
    alamat: profil?.alamat ?? "",
  };

  return (
    <>
      <PageHeader title="Profil Member" description="Lengkapi data personal Anda agar tiket dapat divalidasi." />
      <div className="mb-6">
        {kurang.length === 0 ? (
          <Alert tone="success">Data profil lengkap. Anda dapat memvalidasi tiket.</Alert>
        ) : (
          <Alert tone="info">
            Data profil belum lengkap. Belum terisi: {kurang.map((k) => LABEL_KOLOM_PROFIL[k]).join(", ")}.
          </Alert>
        )}
      </div>
      <Card className="max-w-3xl">
        <ProfilForm awal={awal} hariIni={tanggalWIB()} />
      </Card>
    </>
  );
}
