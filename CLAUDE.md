# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project nature

APS is a **design-first project**: an app (flight ticket booking / travel management) is being specified through user stories and a conceptual model (use case, robustness, sequence diagrams, and a domain model). There is currently **no application code, build system, linter, or test suite** — only documentation under `docs/`. If code is added later, update this file with build/test commands.

The working language of all artifacts is **Indonesian** (Bahasa Indonesia). Keep new stories, diagram labels, and messages in Indonesian, matching existing terminology.

## Artifacts and how they relate

- `docs/user-stories/user-stories.md` — source of truth. Nine stories (US1–US9) with a table of contents, each in the format *Sebagai … / saya ingin … / sehingga …*, followed by `Task` (a/b/c, each with a *Sistem* response) and `Acceptance Criteria`. Anchors are `#usN--slug`; keep the TOC table in sync when adding or renaming stories.
- `docs/duma/APS.dfd.json` — a single multi-diagram document exported from **DUMA** (a diagramming tool; schema `dfd/1`). It holds every conceptual-model diagram in `diagrams[]`, distinguished by `kind`:
  - `class` — "Eksprimen APS": the domain model (classes such as User, HRD Manager, Pegawai, Permohonan Cuti, Riwayat Cuti; currently empty attributes/methods)
  - `usecase` — one Use Case Diagram
  - `robustness` — nine older ICONIX robustness diagrams (boundary/control/entity), partly incomplete (one is only an actor, many edges unlabeled); superseded by the generated file below
  - No sequence diagrams exist in this file.
- `docs/duma/APS-generated.dfd.json` — the **full, current** conceptual model generated from the stories (doc id `doc_aps_generated`). It keeps the `class` and `usecase` diagrams from `APS.dfd.json` unchanged and replaces the robustness set with 18 complete robustness diagrams (`rb_01`…`rb_18`) plus 18 sequence diagrams (`sq_01`…`sq_18`), one pair per use case. `rb_NN` and `sq_NN` describe the same use case. Prefer this file over `APS.dfd.json`; `APS.dfd.json` is the original and was left untouched.
- `docs/md/robustness-diagrams.md` and `docs/md/sequence-diagrams.md` — plain-text summaries of all those diagrams (elements, labeled connections, narration, ordered messages with alt/loop/opt frames). **Read these first** instead of parsing the JSON when you only need to understand the model. They are generated from the JSON, so if you change a diagram in `APS-generated.dfd.json`, update the matching section in the md file too.

Traceability flow: user story → use case → robustness diagram → sequence diagram → domain model (class). Changes to a story should be reflected downstream.

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
