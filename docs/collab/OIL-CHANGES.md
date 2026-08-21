# Oil-change automation — Cursor took this over from GrokBot

Compact session context (read first): [HANDOFF.md](HANDOFF.md). One-shot eFleets CSV → dated copy: [EFLEETS-UPDATE.md](EFLEETS-UPDATE.md).

GrokBot (grok.com) used to own the PDI oil-change loop: a 6:00 AM ET Updater, an Implementer, a Reviewer, and internet bot overdue emails. This Node console now runs the **due-list** half of that job.

## What Cursor owns now

| Job | Was (GrokBot) | Now (this repo) |
|-----|---------------|-----------------|
| Overdue list (`CHANGE OIL AFTER 5K`) | Internet bot emailed the Automations tab | `oil-updater` cron `0 6 * * *`, `POST /api/oil-changes/run`, chat that asks for the list |
| Review | Oil Change Reviewer blocked fake green | `oil-reviewer` refuses overdue rows that are suspect jumps or backward odometers |
| Working sheet | [Automations Copy](https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit?gid=733911326#gid=733911326) `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ` gid `733911326` | Pinned in `config/oil-sheet.json`. Prefer Sheets API (`GOOGLE_SHEETS_ACCESS_TOKEN`) or a CSV export (`OIL_CHANGE_CSV_PATH` / `data/efleets-all-cars.csv`) |

Rules copied from GrokBot's Aug 18–19 emails:

- Due when `lastOil + 5000 - lastReading <= 0`.
- Not due when last reading is **below** last oil (backward).
- Not due when miles since last oil **> 30,000** (incompatible sources; GrokBot called these "readings that look wrong").
- Incomplete rows (missing last oil or last reading) are skipped.
- Never edit the original PDI template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`.
- Never write sheet columns I/J (formulas).

## What still needs a signed-in workstation

GrokBot's 6am prompt also said: update each vehicle from eFleets oil + gas, and use OneStep History when gas is still purple. eFleets login still needs a human on Chrome (do not type passwords). OneStep **shop-stop miles** can be pulled from the terminal: `.cursor/skills/pull-miles-since-oil-shop/SKILL.md`.

Until that session is available here, Cursor still owns the due-list. Prefer a Sheets API token so the updater reads the live tab. Otherwise drop a fresh **eFleets All Cars sorted** CSV at `data/efleets-all-cars.csv`.

Vendor API notes (Sheets official REST, OneStep sourced public paths, eFleets = portal export only): [APIS.md](APIS.md). Attach those clients to Cursor with the `oil-fleet` MCP: [MCP.md](MCP.md).

## How to run

```bash
# uses sample fixture if no live export / Sheets token is present
npm test

# configured? (booleans only — never prints keys)
npm run oil-changes -- --integrations
npm run oil-onestep-probe   # status/counts only; never prints keys or JWTs

# live export (gitignored)
# save Automations Copy → eFleets All Cars sorted as data/efleets-all-cars.csv
OIL_CHANGE_CSV_PATH=data/efleets-all-cars.csv npm run oil-changes
```

Chat the oil agents with "How are the vehicles looking today?" or "list of cars that need an oil change" — they return the real report, not a canned template.
