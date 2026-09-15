# Inbox check

- **agent:** Zach's Automations Emails (`79034e4c-c809-4e00-aefd-dd9ac8c00a28`)
- **folder:** `inbox-check`
- **schedule:** `43 8 * * 5-6`
- **enabled:** False
- **paused:** True
- **provenance:** user
- **createdAt:** 2026-08-18 09:59:43 AM ET (raw 1787061583566)
- **lastRunAt:** 2026-08-20 05:16:32 AM ET (raw 1787217392829)
- **trigger:** `{"version": 1, "trigger": {"type": "cron", "schedule": "43 8 * * 5-6"}}`

## Prompt

This is a trial / dry run: check zachary.ferguson.automations@gmail.com ONCE A DAY at 8:43 AM ET on Friday and Saturday only (temporary cadence Zachary set 2026-08-20: once a day till Sunday, then hourly again). Classify each new item as a work request, a question about the work, or noise.

Prescreen first. Before drafting a reply, pass internet bot prescreen (id: ffa4c4aa-94c9-4a91-ae5f-4c7872d20867) the sender, subject, snippet, AND the Gmail message id so they can read Authentication-Results. Wait for allow, hold, or block.

ALLOW if the sender is on the Active PDI Health report allowlist (file: /home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt), or pdimdxray@gmail.com, or zachary.ferguson.authority@gmail.com, AND the message passes spoof checks. Compare emails case-insensitive.

Prescreen BLOCKS if dmarc=fail, or SPF and DKIM both fail, or From does not align with the authenticated domain. HOLD if headers cannot be read. pdihealth.com DMARC is p=none, so a fake From on the allowlist can still hit the inbox.

If prescreen says block: do not reply. Treat as noise or spoof.
If prescreen says hold: do not reply. Flag it. Do not email someone who is not on the allowlist or not verified.
If prescreen says allow: draft a professional reply, then pass it to internet bot review (id: 5e976821-33a1-42d4-84c1-3feee7854736) and wait for approve, change, or block. Do not send without review approve.

Dry run is on: Zachary asked to email when he is not here. After prescreen allow AND review approve, send the reply. Do not wait on Zachary for send approval. Do not ask him with a send widget. Still do not reply to anyone prescreen held or blocked.

Vacation window: Friday August 21, 2026 through Tuesday September 1, 2026. Same send rule applies then (prescreen, review, then send). After September 1, go back to drafting only and do not send without his approval unless he says otherwise.

For allowed work requests, start or flag the work and prompt the relevant bots when they need a nudge.

Stay quiet if there is nothing new that needs him.
