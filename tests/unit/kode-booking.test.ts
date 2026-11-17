import { describe, expect, it } from "vitest";
import { buatKodeBooking, normalisasiKodeBooking, PANJANG_KODE_BOOKING } from "@/lib/kode-booking";

describe("buatKodeBooking", () => {
  it("menghasilkan 6 karakter dari alfabet tanpa karakter yang mudah tertukar", () => {
    for (let i = 0; i < 200; i++) {
      const kode = buatKodeBooking();
      expect(kode).toHaveLength(PANJANG_KODE_BOOKING);
      expect(kode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    }
  });
  it("deterministik bila sumber acak diberikan", () => {
    expect(buatKodeBooking(() => 0)).toBe("AAAAAA");
  });
});

describe("normalisasiKodeBooking", () => {
  it("menghapus spasi dan membesarkan huruf", () => {
    expect(normalisasiKodeBooking("  ap5 t3k ")).toBe("AP5T3K");
  });
});
