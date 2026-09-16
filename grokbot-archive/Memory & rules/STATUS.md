# STATUS — standing rules at dump 2026-08-20  
  
Zachary paused the team for a week starting 2026-08-20. This file is the current rule set so work can resume without guessing.  
  
## Holds  
  
\- **History remap / OneStep recapture: HOLD until next week.** Fuel-card remap tab paste, history-tab paste, and leftover OneStep recapture (PA24/PA23 and leftover PA21 7/16, 7/21, 7/23 address lists) stay parked.  
\- **Inbox check: paused for the week** (Zachary pausing the team). Disk state of the two internet-bot routines is `enabled: false`.  
 - Was: daily 8:43 AM ET Friday–Saturday (`43 8 * * 5-6`).  
 - Hourly resume was scheduled Sunday 8:14 AM ET (`14 8 * * 0` on the Resume hourly inbox job, which would restore `14 * * * *`).  
\- Do not invent credentials, Chrome profiles, cookies, tokens, or open patient DICOMs.  
  
## Allowed while paused / after resume  
  
\- **OneStep reports are allowed**, but keep it to a couple a day unless Zachary asks for a specific one. History remap stays on hold.  
\- **Dry-run send** after prescreen (`ffa4c4aa-94c9-4a91-ae5f-4c7872d20867`) + review (`5e976821-33a1-42d4-84c1-3feee7854736`). After review approve, internet bot may send without another send OK from Zachary.  
\- **Vacation window:** Friday August 21, 2026 through Tuesday September 1, 2026. Same send rule (prescreen, review, then send). After September 1, draft-only unless he says otherwise.  
  
## Pairing sheet / writers  
  
\- **Oil Change Implementer** (`12ed551c-224f-4387-a90c-a6ec9e071954`) is the only writer on pairing sheet columns A–F (and sheet format).  
\- Oil Change Reviewer looks without leaving a cursor/cell highlight; may write only column G comments on the same row.  
\- Hold if Zachary is on a cell. Off-sheet talk only. One writer.  
  
## Card homes (as of 2026-08-20)  
  
\- **Card 31757** (PA9 last-5 / vehicle # 3175): signed home **PA21**.  
\- **Card 31781** (PA24 last-5 / vehicle # 3178): **DETAILS-only** home **PA23**. OneStep PA24/PA23 not signed yet.  
\- Other 15 of 17 suspected cars stay on their assigned cars until a signed split.  
\- **PA21 30-day punch days** are signed except **7/16, 7/21, 7/23** (distance-only; address lists still missing).  
  
## Local pairing files — leave as-is (do not upload binaries here)  
  
Listed on the box, not copied into this Drive dump (xlsx/json/png too large or binary):  
  
\- `/workspace/uploads/card-history-ready-2026-08-19.xlsx` (12,362 bytes)  
\- `/workspace/uploads/card-history-90d.xlsx` (29,051 bytes)  
\- `/workspace/uploads/DETAILS_583424_90-Days-ALL.xlsx` (1,397,405 bytes) — skip; huge  
\- `/workspace/uploads/card-history-punches.json` (118,269 bytes)  
\- `/workspace/uploads/card-remap-draft.csv`  
\- `/workspace/uploads/card-history-new-dates.txt`  
\- `/workspace/uploads/PA9-signed-miles.md`  
\- `/workspace/uploads/stops/PA21-285JCR-YYYY-MM-DD.md` (signed address lists) and matching `.png` screenshots  
\- `/workspace/uploads/suspected-cards-and-possible-homes.csv` / `.xlsx`  
\- `/workspace/uploads/suspected-cards-2row*.csv` / `.xlsx`  
\- `/workspace/uploads/efleets-live-2026-08-19.csv`  
\- `/workspace/uploads/efleets-today.csv`  
  
Markdown status copies that *are* in `Work snapshot/`:  
  
\- `PA21-signed-days.md`  
\- `card-home-status-2026-08-19.md`  
\- `suspected-cards-plan.md`  
  
## Live sheets (IDs only)  
  
\- Automations Copy (working): `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ` — tab eFleets All Cars sorted gid `733911326`. Suspected cards tab intended here.  
\- Original PDI oil-change template (never edit): `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`  
\- eFleets company 583424 (PDI Services LLC)  
  
## Inbox partners  
  
\- internet bot (this agent / chair): `79034e4c-c809-4e00-aefd-dd9ac8c00a28`  
\- internet bot prescreen: `ffa4c4aa-94c9-4a91-ae5f-4c7872d20867`  
\- internet bot review: `5e976821-33a1-42d4-84c1-3feee7854736`  
\- Allowlist: `/home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt` (408 addresses; copied into this folder)  
  
## Other disk-enabled routines (not internet-bot; still `enabled: true` on disk)  
  
\- Oil Change Updater — Update Automations Spread Sheet — `0 6 * * *` (6:00 AM ET daily)  
\- internet bot prescreen — Screen automations inbox — `35 8-18 * * 1-5` (weekdays 8:35 AM–6:35 PM ET)  
  
Team pause means do not rely on these firing this week unless Zachary unpauses agents.  
  
## Active agent  
  
`/home/box/agent-data/agents/active-agent.json` → `79034e4c-c809-4e00-aefd-dd9ac8c00a28` (Zach's Automations Emails / internet bot).
