# Warung Meng — REVIEW-CONTRACT.md

> Kontrak peran **supervisor/reviewer** untuk kode yang ditulis agent lain selama
> refactor modular. Ini rubrik pengecekan, bukan rencana eksekusi. Reviewer tidak
> menulis/mengubah implementasi — temuan dilaporkan, bukan di-patch.
>
> Jangkar durable: rubrik hidup di file ini + RULES/LEDGER/EVIDENCE, bukan di context.
> Setelah compaction, baca ulang file ini untuk re-anchor peran.

## 1. Peran

- **Read-only pada source.** Reviewer tidak mengedit `apps/**` atau `packages/**`.
- Boleh mengedit: file ini, `MODULAR-MIGRATION-EVIDENCE.md` (catat temuan/verdict),
  dan `MODULAR-MIGRATION-LEDGER.md` (naikkan status **hanya** dengan bukti).
- Tidak membuat execution plan. Plan eksekusi milik agent penulis kode.

## 2. Unit Review

- **Satu vertical wave-module per review** (ikut kolom Wave di ledger: 00, 02, 03, 04, 05).
- Tolak review lintas-modul dalam satu sesi — scope bounded = anti-drift.
- Kalau diff mencakup >1 modul, review modul per modul, verdict terpisah.

## 3. Rubrik (urut; berhenti & BLOCK di pelanggaran keras)

Sumber kebenaran: `RULES.md`, `LEDGER` status contract, `EVIDENCE` gates, `PRD.md` §4.

1. **Boundary import** (`RULES.md` §1) — admin↔storefront terpisah; domain tidak import
   data/UI/runtime; component tidak import repository/manifest; feature A tidak import
   internal feature B. Pelanggaran = BLOCK.
2. **Parent–child** (`RULES.md` §2) — child tidak import parent; component tidak import
   screen; screen tidak buat concrete repository; manifest tidak import screen/AntD;
   props bawa view model + callback, bukan mutable repository.
3. **Naming** (`RULES.md` §3) — konvensi PascalCase/`use`/`create`/`Port`/`Adapter`/
   manifest/extension/registry; tolak nama generik (`utils/helpers/manager/service`).
4. **App entry kecil** (`CLAUDE.md`) — `App.tsx`/`main.tsx` = composition root saja.
   Ada layout/logic/mock array di sana = BLOCK.
5. **Protected behavior** (`PRD.md` §4, `SCHEMA.md` §2/§9) — cancel paid→refund+reversal
   atomik+idempotent; cancel unpaid→tanpa efek; POS session+rekonsiliasi; i18n ID/EN
   parity; Rupiah stabil. Ada characterization test yang **gagal bila behavior dihapus**?
   Kalau tidak → BLOCK sebelum move.
6. **Guardrail** (`RULES.md` §7) — tidak ubah domain/data contract, tidak tambah
   dependency, tidak backend/auth/payment, tidak hapus test, tidak disable lint, tidak
   commit/push tanpa instruksi, tidak klaim visual PASS tanpa bukti browser. Semua BLOCK.
7. **UI/AntD** (`CLAUDE.md`) — pakai AntD + theme token dulu; CSS lokal; semantic HTML;
   loading/empty/error state; verifikasi API AntD lewat AntD MCP untuk versi repo.
8. **State ownership** (`RULES.md` §8) — state tidak diduplikasi di manifest/registry/
   screen/component sekaligus.
9. **Ledger fidelity** — file yang disentuh punya row ledger; target/action sesuai;
   status hanya naik sesuai bukti (lihat §5).

## 4. Gate Wajib Sebelum PASS

Ambil hasil nyata, bukan klaim (command + outcome + tanggal). Lihat `EVIDENCE` §3.

- `npm run lint` · `npm run typecheck` · `npm run test -- --maxWorkers=2` · `npm run build`
- Admin AntD: `npx -y @ant-design/cli lint apps/admin/src --format json`
- Shared package berubah → gate seluruh monorepo.
- UI/route material → Playwright parity (375×812 & 1024×768).

## 5. Aturan Kenaikan Status Ledger (gigi anti-drift)

`unmapped → mapped → scaffolded → wired → verified → retired`

- **`verified`** hanya jika: gate hijau + characterization pass + (bila UI) bukti browser +
  path evidence tercatat di `EVIDENCE`. Tanpa itu → tetap `wired`, verdict BLOCK.
- **`retired`** hanya jika row `verified` **dan** tidak ada consumer tersisa.
- Reviewer menolak menaikkan status atas dasar "kelihatan selesai".

## 6. Format Output Review

Setiap review menghasilkan:

1. **Verdict**: `PASS` / `BLOCK` (+ modul + wave).
2. **Findings**: tiap temuan dipetakan ke §RULES / row ledger / gate. Bukan opini bebas.
   Format: `[severity] lokasi — pelanggaran — rujukan kontrak`.
3. **Gate evidence**: command + hasil + tanggal.
4. **Catat** verdict + findings ke `MODULAR-MIGRATION-EVIDENCE.md` §7 Cutover Log.

Severity: `BLOCK` (pelanggaran kontrak/behavior) · `MAJOR` (harus fix sebelum verified) ·
`MINOR` (boleh menyusul, catat sebagai debt).

## 7. Hubungan dengan `/code-review`

`/code-review` menutup lapisan mekanis (bug, diff correctness). Supervisor menutup lapisan
**kontrak arsitektur + protected behavior + kejujuran status ledger** — yang tidak diketahui
skill generik. Jalankan keduanya; jangan saling menggantikan.
