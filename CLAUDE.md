# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project nature

APS is a **design-first project** (flight ticket booking / travel management) specified through user stories and a conceptual model (use case, robustness, sequence diagrams, domain model) under `docs/`, **and implemented as a fullstack app** (Next.js App Router + Tailwind + Prisma/PostgreSQL) at the repo root. All nine stories (US1–US9) are implemented. The design artifacts stay the source of truth: change a story/diagram first, then the code.

The working language of all artifacts **and of the UI** is **Indonesian** (Bahasa Indonesia). Keep new stories, diagram labels, UI copy, error messages, and identifiers (`pesanan`, `penerbangan`, `cuti`…) in Indonesian, matching existing terminology.

## Commands

Full setup, DB switching, and Vercel deploy are in `README.md`. Essentials (Node 22+, Docker):

```bash
npm run db:up                    # docker compose: PostgreSQL (host port 5433, NOT 5432) + Mailpit (UI :8025)
npm run db:migrate -- --name x   # prisma migrate dev (refused when DB_TARGET=cloud)
npm run db:deploy                # prisma migrate deploy (local or cloud)
npm run db:seed                  # deterministic demo data; WIPES the DB; refused on cloud without --force-cloud
npm run dev                      # http://localhost:3000   (demo logins: *@aps.test / Demo#12345)
npm run lint && npm run typecheck && npm test   # Vitest unit+integration (needs db:up; uses DB aps_test)
npm run test:e2e                 # Playwright; reseeds aps_test, port 3100, own build dir (.next-e2e) — safe next to `next dev`
npx vitest run tests/integration/booking.test.ts -t "kapasitas"   # single file / test name
```

`npm test` and `npm run test:e2e` both use the `aps_test` database (never the dev DB) and both reset it, so run them **sequentially**, not at the same time. Next.js here is v16 (breaking changes vs. older versions): `proxy.ts` replaces `middleware.ts`, `searchParams`/`params` are Promises, and version-specific docs live in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Architecture (code)

- **Layering mirrors the robustness diagrams**: boundary → page/component in `src/app` · control → function in `src/server/services/*` · entity → model in `prisma/schema.prisma`. Service functions are named after the diagram controls (e.g. `prosesPemesanan`, `otorisasiKodeBooking`). Story → route → service → test mapping: `docs/md/implementation-map.md`.
- **Pages are Server Components reading `searchParams`** (GET forms, shareable URLs, no-JS friendly); mutations are Server Actions that call a service. Services validate with zod (`src/server/validation`), throw `GalatBisnis`/`GalatValidasi` (`src/server/errors.ts`) for user-facing errors, and never trust the proxy alone — authorization is re-checked via `wajibBisa(ability)` (`src/server/auth/session.ts`) and ownership-scoped queries.
- **Roles** (`src/server/auth/roles.ts`): `can(role, ability)`, `ROUTE_ACCESS` (route prefix → roles, enforced in `src/proxy.ts`), and `NAV_ITEMS` (add an entry when you add a page). Auth.js v5 (beta) credentials + JWT carrying `id` and `role`.
- **Database switch**: `src/server/db-target.ts` is the single place that picks the URL from `DB_TARGET=local|cloud`; `prisma.config.ts`, the runtime client (`src/server/db.ts`, lazy so `next build` needs no DB), seed, and `scripts/db.ts` all use it. Prisma 7 with the `pg` driver adapter; generated client in `src/generated/prisma` (gitignored; created by `postinstall`). Prisma is pinned to **7.10.1** — npm's `latest` tag is an 8.0 RC.
- **Booking integrity**: `buatBookingDiTransaksi` (`services/booking.ts`) does availability → duplicate check → atomic seat decrement inside one transaction with a per-(owner, flight) advisory lock; reused by Manager Travel's visitor booking (US8-b), which also finds/creates the visitor + login account in the same transaction. Cancellation restores seats exactly once.
- **E-tiket**: `services/etiket.ts` sends one email per ticket through an `EmailDriver` (`smtp`→Mailpit, `resend` via fetch); every attempt is recorded in `NotifikasiEmail`, failures never fail the booking, resend is idempotent.
- **Times** are stored UTC and interpreted/displayed in WIB (`src/lib/waktu.ts`); leave dates are `DATE` columns handled as UTC midnight (`src/lib/cuti.ts`).

Gotchas learned the hard way: e2e locators like `getByRole("link", { name: "Pesan" })` substring-match the nav link "Pesanan Saya" — use `exact: true`; the same text often appears in header and page body — scope to `getByRole("main")`. `getByRole("alert")` also matches Next's route announcer — filter by text.

## Artifacts and how they relate

- `docs/user-stories/user-stories.md` — source of truth. Nine stories (US1–US9) with a table of contents, each in the format *Sebagai … / saya ingin … / sehingga …*, followed by `Task` (a/b/c, each with a *Sistem* response) and `Acceptance Criteria`. Anchors are `#usN--slug`; keep the TOC table in sync when adding or renaming stories.
- `docs/duma/APS.dfd.json` — a single multi-diagram document exported from **DUMA** (a diagramming tool; schema `dfd/1`). It holds every conceptual-model diagram in `diagrams[]`, distinguished by `kind`:
  - `class` — "Eksprimen APS": the domain model (classes such as User, HRD Manager, Pegawai, Permohonan Cuti, Riwayat Cuti; currently empty attributes/methods)
  - `usecase` — one Use Case Diagram
  - `robustness` — nine older ICONIX robustness diagrams (boundary/control/entity), partly incomplete (one is only an actor, many edges unlabeled); superseded by the generated file below
  - No sequence diagrams exist in this file.
- `docs/duma/APS-generated.dfd.json` — the **full, current** conceptual model generated from the stories (doc id `doc_aps_generated`). It keeps the `class` and `usecase` diagrams from `APS.dfd.json` unchanged and replaces the robustness set with 18 complete robustness diagrams (`rb_01`…`rb_18`) plus 18 sequence diagrams (`sq_01`…`sq_18`), one pair per use case. `rb_NN` and `sq_NN` describe the same use case. Prefer this file over `APS.dfd.json`; `APS.dfd.json` is the original and was left untouched.
- `docs/md/robustness-diagrams.md` and `docs/md/sequence-diagrams.md` — plain-text summaries of all those diagrams (elements, labeled connections, narration, ordered messages with alt/loop/opt frames). **Read these first** instead of parsing the JSON when you only need to understand the model. They are generated from the JSON, so if you change a diagram in `APS-generated.dfd.json`, update the matching section in the md file too.

Traceability flow: user story → use case → robustness diagram → sequence diagram → domain model (class) → code (`docs/md/implementation-map.md`, `prisma/schema.prisma`, `src/server/services`). Changes to a story should be reflected downstream, including the implementation map.

### Story → diagram map (APS-generated.dfd.json)

| Story | Robustness / Sequence |
|---|---|
| US1 | 01 jadwal cuti, 02 pengajuan cuti, 03 riwayat cuti |
| US2 | 04 jadwal penerbangan, 07 memesan tiket, 08 membatalkan tiket |
| US3 | 05 beberapa tujuan |
| US4 | 06 multi-destinasi |
| US5 | 09 update profil, 10 validasi tiket |
| US6 | 11 sesuai preferensi, 12 membandingkan harga (memesan = 07) |
| US7 | 13 status booking + filter |
| US8 | 14 mencari tiket, 15 memesan untuk pengunjung, 17 tiket terpesan, 18 e-tiket |
| US9 | 16 otorisasi kode booking reference |

## Working with the DUMA JSON

- The files are large (~78 KB original, ~155 KB generated) and machine-generated; don't read them whole. Inspect with a script, e.g. `python3 -I -c "import json; d=json.load(open('docs/duma/APS-generated.dfd.json')); [print(g['kind'], g['id'], g['title'], len(g['nodes']), len(g['edges'])) for g in d['diagrams']]"`.
- Generated diagrams use readable ids: `rb_NN`/`sq_NN` for diagrams, `rNN_<key>`/`sNN_<key>` for nodes, `rNN_iK`/`sNN_mK` for edges (sequence message order = `edges` order). Original diagrams use DUMA-assigned ids (`dg_`, `cl_`, `uc_`, `rb_`, `fl_`).
- Each diagram has `nodes` (with `id`, `type`, `label`, `x`, `y`, `w`, `h`, `meta`) and `edges`. IDs are prefixed per node kind (e.g. `cl_` for class, `dg_` for diagram) and `rootId` points at the root diagram — preserve ID uniqueness and references when editing.
- Edit the JSON via a script or targeted edits rather than rewriting it, and keep it valid for re-import into DUMA.
- Project skills exist for generating importable DUMA diagrams that pass DUMA's rule checks: `/duma-usecase`, `/duma-robustness`, `/duma-sequence`, `/duma-uml` (class), `/duma-activity-diagram`, `/duma-erd`, `/duma-sitemap`. Prefer them when creating or fixing diagrams.

## Content notes

- Actors across stories: HRD manager (US1), generic Pengguna (US2–3), Member frequent traveller (US4–6), Manajer travel (US7–9). US1 (leave schedule) is domain-unrelated to the flight-booking stories, and the class diagram already models it (Pegawai, Permohonan Cuti, Riwayat Cuti).
- Naming in the generated diagrams: the travel-manager actor is **Manager Travel** (the original use case diagram has the typo "Manager Travell" and the class diagram says "Manager Traveller"). Entities reuse class names; "Profil Member" is the profile data of Member Frequent Traveller and "Data Pengunjung" is the Pengunjung class (renamed to avoid clashing with the actor of the same name). A new booking starts as `booked` (assumption; the stories don't specify).
- In the sequence diagrams, error outcomes are `async` messages (not `reply`) so each `sync` call has at most one reply across the alt frames.
- Specific system messages are mandated by stories and must be reproduced verbatim: "data profil tidak lengkap" (US5) and "kode booking reference tidak sesuai" (US9).
- Booking statuses are `confirmed`, `booked`, `waiting for the payment` (US7).
