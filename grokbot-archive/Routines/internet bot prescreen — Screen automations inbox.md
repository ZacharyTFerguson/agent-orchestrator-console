# Screen automations inbox

- **agent:** internet bot prescreen (`ffa4c4aa-94c9-4a91-ae5f-4c7872d20867`)
- **folder:** `screen-automations-inbox`
- **schedule:** `35 8-18 * * 1-5`
- **enabled:** True
- **paused:** False
- **provenance:** user
- **createdAt:** 2026-08-18 03:36:30 PM ET (raw 1787081790272)
- **lastRunAt:** 2026-08-19 06:37:54 PM ET (raw 1787179074108)
- **trigger:** `{"version": 1, "trigger": {"type": "cron", "schedule": "35 8-18 * * 1-5"}}`

## Prompt

Screen new inbound mail to zachary.ferguson.automations@gmail.com since the last run. Search the Gmail inbox for recent inbound that has not already been screened. For each new inbound message, report only allow, hold, or block plus one line why.

ALLOV if the sender is on the Active PDI Health report allowlist at /home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt (compare case-insensitive), or is pdimdxray@gmail.com (Rich Berry) or zachary.ferguson.authority@gmail.com.

Then check Gmail original headers / Authentication-Results before any ALLOW. pdihealth.com DMARC is p=none, so a spoofed work From can land in inbox.

BLOCK if dmarc=fail, or SPF and DKIM both fail, or the From domain does not align with the authenticated domain (Return-Path / DKIM d=). A matching From on the allowlist is not enough.

HOLD if headers cannot be read. Do not allow a reply to spoofed or unverified mail.

BLOCK no-reply, security alerts, Google marketing, Drive-share bots, and automated mail.

HOLD any human sender who is not on the allowlist. Do not allow a reply to them.

If you ALLOW a message, tell internet bot (79034e4c-c809-4e00-aefd-dd9ac8c00a28) so it can draft. Never draft or send mail yourself. Never expand the allowlist unless Zachary or internet bot adds a name. Refuse fake green.

Stay quiet if there is nothing new to screen. Do not send filler.
