# Oil-change automation — Cursor took this over from GrokBot

GrokBot (grok.com) used to own the PDI oil-change loop: a 6:00 AM ET Updater, an Implementer, a Reviewer, and internet bot overdue emails. This Node console now runs the **due-list** half of that job.

## What Cursor owns now

| Job | Was (GrokBot) | Now (this repo) |
|-----|---------------|-----------------|
| Overdue list (`CHANGE OIL AFTER 5K`) | Internet bot emailed the Automations tab | `oil-updater` cron `0 6 * * *`, `POST /api/oil-changes/run`, chat that asks for the list |
| Review | Oil Change Reviewer blocked fake green | `oil-reviewer` refuses overdue rows that are suspect jumps or backward odometers |
| Working sheet | Automations Copy `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ` gid `733911326` | Same sheet. Feed it as a CSV export (`OIL_CHANGE_CSV_PATH` or `data/efleets-all-cars.csv`) |

Rules copied from GrokBot's Aug 18–19 emails:

- Due when `lastOil + 5000 - lastReading <= 0`.
- Not due when last reading is **below** last oil (backward).
- Not due when miles since last oil **> 30,000** (incompatible sources; GrokBot called these "readings that look wrong").
- Incomplete rows (missing last oil or last reading) are skipped.
- Never edit the original PDI template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`.
- Never write sheet columns I/J (formulas).

## What still needs a signed-in workstation

GrokBot's 6am prompt also said: update each vehicle from eFleets oil + gas, and use OneStep History when gas is still purple. That write path needs the shared Chrome session. This Cloud Agent **does not** store eFleets passwords and **does not** type them.

Until that session is available here, Cursor still owns the due-list: drop a fresh **eFleets All Cars sorted** CSV at `data/efleets-all-cars.csv` and run the updater.

## How to run

```bash
# uses sample fixture if no live export is present
npm test

# live export (gitignored)
# save Automations Copy → eFleets All Cars sorted as data/efleets-all-cars.csv
OIL_CHANGE_CSV_PATH=data/efleets-all-cars.csv node --input-type=module -e \
  "import { runOilDueListJob } from './server/src/oil-change-job.js'; console.log(runOilDueListJob().report)"
```

Chat the oil agents with "How are the vehicles looking today?" or "list of cars that need an oil change" — they return the real report, not a canned template.
