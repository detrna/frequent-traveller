import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCAL_URL,
  describeUrl,
  getDatabaseUrl,
  getDbTarget,
  getTestDatabaseUrl,
} from "@/server/db-target";

describe("getDbTarget", () => {
  it("default ke local", () => {
    expect(getDbTarget({})).toBe("local");
  });
  it("menerima local dan cloud (tidak peka huruf besar/kecil)", () => {
    expect(getDbTarget({ DB_TARGET: "CLOUD" })).toBe("cloud");
    expect(getDbTarget({ DB_TARGET: " local " })).toBe("local");
  });
  it("menolak nilai lain", () => {
    expect(() => getDbTarget({ DB_TARGET: "staging" })).toThrow(/DB_TARGET tidak valid/);
  });
});

describe("getDatabaseUrl", () => {
  it("memakai URL lokal bawaan bila tidak diisi", () => {
    expect(getDatabaseUrl({})).toBe(DEFAULT_LOCAL_URL);
  });
  it("memakai DATABASE_URL_LOCAL untuk target local", () => {
    expect(getDatabaseUrl({ DB_TARGET: "local", DATABASE_URL_LOCAL: "postgresql://x:y@h:1/d" })).toBe(
      "postgresql://x:y@h:1/d",
    );
  });
  it("memakai DATABASE_URL_CLOUD untuk target cloud dan mengabaikan URL lokal", () => {
    const url = getDatabaseUrl({
      DB_TARGET: "cloud",
      DATABASE_URL_LOCAL: "postgresql://local/db",
      DATABASE_URL_CLOUD: "postgres://u:p@db.prisma.io:5432/postgres?sslmode=require",
    });
    expect(url).toBe("postgres://u:p@db.prisma.io:5432/postgres?sslmode=require");
  });
  it("cloud: jatuh ke POSTGRES_URL bila DATABASE_URL_CLOUD kosong", () => {
    expect(getDatabaseUrl({ DB_TARGET: "cloud", POSTGRES_URL: "postgres://a:b@c:5432/d" })).toBe(
      "postgres://a:b@c:5432/d",
    );
  });
  it("cloud: menolak URL prisma+postgres:// (Accelerate) karena adapter pg butuh koneksi langsung", () => {
    expect(() =>
      getDatabaseUrl({ DB_TARGET: "cloud", DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net/?api_key=x" }),
    ).toThrow(/DATABASE_URL_CLOUD/);
  });
  it("cloud tanpa URL melempar galat yang jelas", () => {
    expect(() => getDatabaseUrl({ DB_TARGET: "cloud" })).toThrow(/DATABASE_URL_CLOUD/);
  });
});

describe("getTestDatabaseUrl", () => {
  it("menunjuk database aps_test secara bawaan", () => {
    expect(getTestDatabaseUrl({})).toMatch(/\/aps_test$/);
  });
});

describe("describeUrl", () => {
  it("menyembunyikan kata sandi", () => {
    const text = describeUrl("postgres://user:rahasia@host.example:5432/mydb?sslmode=require");
    expect(text).not.toContain("rahasia");
    expect(text).toBe("postgres://user:***@host.example:5432/mydb");
  });
});
