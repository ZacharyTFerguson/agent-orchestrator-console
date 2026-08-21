# eFleets → oil-sheet copy (agent plan)

This is a **one-shot** pipeline. It does **not** log into eFleets. It does **not** write the live working sheet.

## Target

| Role | Spreadsheet |
| --- | --- |
| Live working sheet (do not write this pass) | pinned in `config/oil-sheet.json` |
| Dated copy (writes allowed) | `config/oil-update-copy.json` — [Automations Copy — eFleets update 2026-08-21](https://docs.google.com/spreadsheets/d/1F3KrNhD8xDvIlyumigiQzVkK_C9FaDKOVdJaCX_yASE/edit?gid=733911326#gid=733911326) |

The copy’s first tab is **eFleets All Cars sorted** (gid `733911326`), so a Drive CSV export of the file is that tab. Still write with the named range, never by first-sheet accident.

```bash
npm run oil-sheet-update -- --sheet data/efleets-all-cars.csv \
  --details path/to/details.csv --maintenance path/to/maintenance.csv \
  --fleet path/to/fleet-summary.csv \
  --spreadsheet-id 1F3KrNhD8xDvIlyumigiQzVkK_C9FaDKOVdJaCX_yASE \
  --out /tmp/oil-copy-patches.json
```

Stdout is counts only. The JSON has A1 ranges + odometer/date values, no VIN/plate.

Never write original template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`. Never write columns **I/J**.

## Inputs (local CSVs only)

| Export | Use |
| --- | --- |
| Details 90-day | Last Reading = latest **Provider Odometer** where Unusual flag is **N**. Skip Y. |
| Maintenance 90-day | Last Oil = latest **Work Completed** lube/oil RO (not filter-only / surcharge / air / chassis). |
| Fleet Summary | **ID index only** (Vehicle = eFleets ID, Customer Vehicle ID = unit). **Never** Calculated Mileage. |

## Efficiency (do not loop LLMs per row)

1. **Copy** — Drive `copy_file` once (already done for the dated copy).
2. **Ingest** — `npm run oil-sheet-update` locally. One Node job parses CSVs + proposes E/F and G/H patches. No VIN/plate in stdout.
3. **Reviewer** — same rules as `classifyVehicle`: skip backward odo, skip jumps **> 30,000**, do not regress older oil dates, do not write odo below last oil.
4. **Implementer** — Composio `GOOGLESHEETS_UPDATE_VALUES_BATCH` on the **copy only**, `USER_ENTERED`, chunks of ~40 ranges. One batch = one write toward the 60/min cap.
5. **Reporter** — recompute due-list **counts**. Do not paste unit/VIN/plate rows.

## Agents (orchestrator)

Existing Planner / Researcher / Executor stay. Oil specialists:

- `oil-updater` — ingest + propose
- `oil-reviewer` — skip rules
- `oil-implementer` — batch write copy only

This pass is **not** cron. Re-run when the user drops new eFleets CSVs.

## After a good copy

Do **not** retarget `config/oil-sheet.json` unless the user says the dated copy is now the working sheet.
