# Resume hourly inbox

- **agent:** Zach's Automations Emails (`79034e4c-c809-4e00-aefd-dd9ac8c00a28`)
- **folder:** `resume-hourly-inbox`
- **schedule:** `14 8 * * 0`
- **enabled:** False
- **paused:** True
- **provenance:** user
- **createdAt:** 2026-08-20 05:44:25 AM ET (raw 1787219065641)
- **lastRunAt:** never (raw None)
- **trigger:** `{"version": 1, "trigger": {"type": "cron", "schedule": "14 8 * * 0"}}`

## Prompt

Sunday restore: Zachary asked on 2026-08-20 to check email once a day till Sunday, then hourly again.

1. Update the Inbox check routine (folder inbox-check) back to hourly at :14 — schedule `14 * * * *` — and restore its prompt to say it checks zachary.ferguson.automations@gmail.com at 14 minutes past every hour. Keep every other rule the same: prescreen (id: ffa4c4aa-94c9-4a91-ae5f-4c7872d20867) with Gmail message id before any draft; allowlist file /home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt plus pdimdxray@gmail.com and zachary.ferguson.authority@gmail.com; block on dmarc=fail or SPF+DKIM both fail or From not aligned; hold if headers unreadable; pdihealth.com DMARC is p=none; review (id: 5e976821-33a1-42d4-84c1-3feee7854736) before send; dry run send after approve without waiting on Zachary; vacation Friday August 21, 2026 through Tuesday September 1, 2026 then draft-only after Sep 1; stay quiet if nothing new.
2. Run one inbox check now.
3. Delete this Resume hourly inbox routine after the hourly schedule is restored. Do not leave this Sunday-only job running.
