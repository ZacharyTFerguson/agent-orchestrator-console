# Compact context — oil-change Cloud Agent

Read this file instead of the long prior thread. Written 2026-08-21. Public repo: never dump VIN, plate, or other PII into git, chat, or artifacts.

## Repo and run

| | |
|---|---|
| Repo | `github.com/ZacharyTFerguson/agent-orchestrator-console` (Node/React console: chat, cron, heartbeats, SQLite) |
| Branch | `cursor/efleets-copy-update-ea59` (base `main`) |
| Draft PR | https://github.com/ZacharyTFerguson/agent-orchestrator-console/pull/4 |
| Cloud run | Oil changes automation migration · `bc-4087ff70-b35a-4807-a261-fda00acbea59` |
| Cursor owner | `nasbaseball@gmail.com` (Zachary Ferguson) |
| Environment | Personal DB-managed `[fa4e9ac9-9c72-11f1-ba66-0e7d0216e441](https://cursor.com/dashboard/cloud-agents/environments/e/fa4e9ac9-9c72-11f1-ba66-0e7d0216e441)`. `environmentJsonPath` is null. Repo `.cursor/environment.json` is not the effective source. |
| Do not | Commit `package-lock.json` (install-script only). Do not snapshot/build the VM unless asked. |

## Working sheet (only)

- File: Automations Copy of PDI - Oil change spreadsheet updated
- ID `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ` · tab **eFleets All Cars sorted** · gid `733911326`
- URL: https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit?gid=733911326#gid=733911326
- Pin: `config/oil-sheet.json` (overrides: `OIL_CHANGE_SHEET_ID` / `GID` / `TAB`)
- Owner: `zachary.ferguson.authority@gmail.com`
- Editor: `zachary.ferguson.automations@gmail.com` (Google share email 2026-08-17). Drive ACL listing often shows only the owner; ignore that.
- Never edit original PDI template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`
- Never write columns **I/J**

Due when `lastOil + 5000 - lastReading <= 0`. Skip backward odometer, jumps **> 30,000** miles, incomplete rows. Last Reading = Enterprise odo at a known second **+** OneStep distance since that second. Never OneStep’s own odometer / Calculated Mileage.

eFleets company `583424`, portal `https://login.efleets.com/fleetweb`. No public customer REST API. Do not type or store eFleets passwords. History remap / OneStep recapture **HOLD**.

Latest known due-list match (GrokBot Aug 19 / later Drive export): **30 overdue, 5 suspect, 14 backward**. Export size ~201 vehicles, ~15 incomplete. Recompute; do not paste unit rows.

## Dated eFleets-update copy (this pass)

Live working sheet stays pinned. Writes from the 90-day eFleets CSVs go to a **copy**:

- File: Automations Copy — eFleets update 2026-08-21
- ID `1F3KrNhD8xDvIlyumigiQzVkK_C9FaDKOVdJaCX_yASE` · same tab/gid
- URL: https://docs.google.com/spreadsheets/d/1F3KrNhD8xDvIlyumigiQzVkK_C9FaDKOVdJaCX_yASE/edit?gid=733911326#gid=733911326
- Pin: `config/oil-update-copy.json`
- First tab **is** the sorted tab, so a Drive CSV export is that tab. Still write with the named range.
- Plan: [EFLEETS-UPDATE.md](EFLEETS-UPDATE.md). CLI: `npm run oil-sheet-update`. Do not retarget `config/oil-sheet.json` unless asked.

## What this branch already shipped

- Due-list: `server/src/oil-changes.js`, `oil-change-job.js`, `oil-change-cli.js` (`npm run oil-changes`)
- Agents in `config/orchestrator.config.json`: `oil-updater` (`0 6 * * *`, `oil-due-list`), `oil-implementer`, `oil-reviewer`. Keep Planner / Researcher / Executor.
- API: `GET/POST /api/oil-changes`, `/api/oil-changes/run`, `GET /api/integrations`
- Light clients (no `googleapis`, no Chrome): `server/src/clients/{http,sheets,onestep,efleets}.js`
- oil-fleet stdio MCP: `server/src/mcp/oil-mcp.js` · tools `oil_status`, `oil_due_list`, `sheets_get_values`, `sheets_update_values`, `onestep_*`, `compose_last_reading`
- IDE config: `.cursor/mcp.json` lists `composio` → `https://connect.composio.dev/mcp` and `oil-fleet` stdio
- Docs: `docs/collab/OIL-CHANGES.md`, `APIS.md`, `MCP.md`, `EFLEETS-UPDATE.md`
- Tests: `npm test` last green at **49/49** (re-run after code changes)
- eFleets CSV → copy: `server/src/efleets-exports.js`, `oil-sheet-update.js`, `npm run oil-sheet-update`

## Identities (do not paste tokens)

| Role | Account |
|---|---|
| Cursor Cloud / Composio account owner | `nasbaseball@gmail.com` — fine. Not the Sheets identity. |
| Drive MCP on this run | `zachary.ferguson.authority@gmail.com` — can export the sheet. `update_file` is title/parent only. `share_file` on the working sheet fails (“caller does not have permission”). |
| Gmail MCP on this run | `zachary.ferguson.automations@gmail.com` |
| Sheets cell identity to use | `automations@` or `authority@` |

`GOOGLE_SHEETS_ACCESS_TOKEN` / `GOOGLE_SHEETS_API_KEY` / `COMPOSIO_API_KEY` were unset on this VM. Official Sheets `values.get` without a token is `403`.

Access-request Doc (same folder): https://docs.google.com/document/d/1I6UHBZu0nsr5_7mvhDB4ZFFUXyTqv4iEvQfTBYYns-c/edit — automations@ is writer.

## MCP status at handoff (2026-08-21 ~16:36 UTC)

| Server | Status |
|---|---|
| **Composio** | **Ready and proven.** Connected as `zachary.ferguson.automations@gmail.com` (`googlesheets` ACTIVE). Header-only `GOOGLESHEETS_BATCH_GET` on `'eFleets All Cars sorted'!A1:H1` succeeded 2026-08-21. Writes: not I/J, not original template. |
| Google Drive | Ready (owner). Export/read OK. No cell write. |
| Gmail | Ready (automations@). |
| ClickUp | Ready (unused for oil). |
| oil-fleet | In repo. Cloud does not auto-load `.cursor/mcp.json`. Attach separately if needed: stdio `node` + `server/src/mcp/oil-mcp.js`. |

Composio Connect URL `https://connect.composio.dev/mcp` is live streamable HTTP. Unauthenticated calls were `401` + OAuth `https://login.composio.dev`. Cursor `+` → **MCP Servers** is the login UI (not a header control, not Dashboard Integrations).

## Conversation (compact)

1. Take over GrokBot oil-change due-list in this repo — done on this branch.
2. Can this agent log into eFleets / OneStep / Sheets? Drive yes (export). eFleets no (no API, no passwords). OneStep only sourced paths; History HOLD. Sheets cells needed Composio or a token.
3. Research APIs and keep apps light — done (`docs/collab/APIS.md`).
4. MCP for Cloud Agents — oil-fleet stdio shipped; Cloud must attach it. HTTP preferred when hosted.
5. Spreadsheet is the environment — pinned `config/oil-sheet.json`.
6. How to give agents a Sheets token — environment Runtime Secret `GOOGLE_SHEETS_ACCESS_TOKEN` on a **new** agent. Do not paste into chat. Access tokens die ~1 hour.
7. Sign in to Sheets / Composio — catalog Composio was `needsAuth` for most of the run.
8. `automations@` has access — confirmed (Aug 17 share + GrokBot already emailed due lists from this inbox).
9. User asked to see the MCP dropdown — `+` left of the follow-up box → **MCP Servers**.
10. User asked to try `https://connect.composio.dev/mcp` — probed `401` OAuth; added URL to `.cursor/mcp.json`. User skipped the “Add MCP” setup action.
11. User said **Stop** on environment snapshot/build.
12. User asked only to log into Sheets — Composio Login via `+` → MCP Servers.
13. This handoff: Composio is now **ready** with googlesheets connected. Next agent should retry a **header-only** cell read, then stop unless asked to write.

## Dashboard tab (gid `1615250816`)

**PDI Oil Change Tracker & Fleet Automation Dashboard** is an OBJECT canvas — no cell grid. Correct **Oil Change Summary** (VA D–G) and the sorted tab instead. H/I on the summary stay formulas.

VA 31 last reading is **held** at `12949` / `8/11` (card nickname still stamped VA2). See Suspected cards on the dated copy. Do not invent card numbers. Do not paste plates or driver names.

## Next agent — first actions

1. Dated copy **already has** the 2026-08-21 90-day eFleets CSV apply plus the VA summary sync / VA 31 hold. Sorted-tab counts after the CSV apply: 27 overdue, 5 suspect, 22 backward, 18 incomplete (was 30 / 5 / 14 / 19). Do not paste unit rows.
2. Do not retarget `config/oil-sheet.json` unless the user says that copy is now the working sheet.
3. Do not start an environment snapshot or draft build unless the user asks.
4. eFleets portal login stays HOLD. OneStep secrets were **skipped** on 2026-08-21. Do not re-prompt. Miles-since stays HOLD. JWT wrap is in the client for later. Do not paste the key, PEM, or a signed JWT into chat.

## Pointers

- Due-list rules and cron: `docs/collab/OIL-CHANGES.md`
- Vendor APIs: `docs/collab/APIS.md`
- MCP attach: `docs/collab/MCP.md`
