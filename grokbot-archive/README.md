# GrokBot archive — 2026-08-20  
  
Dumped **2026-08-20** because Zachary paused the team for a week.  
  
This folder is text/markdown only. No credentials, Chrome profiles, cookies, tokens, or patient DICOMs.  
  
## Folder layout  
  
```  
GrokBot/  
 README.md ← this file  
 Personalities/ ← one markdown file per agent (from profile.json)  
 Groups.md ← no group.json rooms found  
 Skills/ ← copy of every user workflow SKILL.md  
 MANAGED-SKILLS.md ← note that learn-from-demonstration and add-connector are platform skills  
 Routines/ ← every automation.json found (inbox + others)  
 Memory & rules/  
 STATUS.md ← current standing rules  
 internet-bot-profile.md  
 internet-bot-log-2026-08.md  
 pdi-active-allowlist.txt ← 408-email PDI allowlist  
 other-agents/ ← other agents' memory/profile.md  
 Work snapshot/ ← lean markdown status files only  
```  
  
## How to resume  
  
1\. Unpause agents.  
2\. Unpause **Inbox check**. Cadence before the team pause:  
 - Daily Friday and Saturday at **8:43 AM ET** (`43 8 * * 5-6`).  
 - Then hourly at **:14** starting Sunday 8:14 AM ET (the `Resume hourly inbox` job at `14 8 * * 0` restores `14 * * * *` and deletes itself).  
3\. **History remap / OneStep recapture stays HOLD until next week.** Do not paste remap/history tabs or finish PA24/PA23 / leftover PA21 7/16, 7/21, 7/23 address lists until then.  
4\. **OneStep reports are allowed**, but only a couple a day unless Zachary asks for a specific one.  
5\. **Vacation:** Friday August 21, 2026 through Tuesday September 1, 2026. Dry-run send after prescreen (`ffa4c4aa-94c9-4a91-ae5f-4c7872d20867`) **and** review (`5e976821-33a1-42d4-84c1-3feee7854736`). After September 1, draft-only unless he says otherwise.  
6\. Local pairing files on the box stay as-is. See `Memory & rules/STATUS.md` for paths. Do not re-upload huge xlsx.  
  
## What was skipped  
  
\- Conversation transcripts / `conversation-blobs.db` / `store.db` / `audit.jsonl`  
\- Chrome profiles, cookies, tokens, passwords, API keys  
\- Patient DICOM files and any `.dcm`  
\- Huge / binary work files: `DETAILS_583424_90-Days-ALL.xlsx`, `card-history-ready-2026-08-19.xlsx`, `card-history-90d.xlsx`, punch JSON, stop-list PNGs  
\- Platform managed-skill bodies (noted only)  
\- `group.json` rooms (none present)
