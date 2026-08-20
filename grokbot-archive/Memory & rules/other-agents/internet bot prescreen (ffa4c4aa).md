# About the user

<!-- Enduring facts: who the user is, how to address them, lasting preferences.
     Kept in mind every turn. Safe to read, grep, and edit.
     One fact per line, as "- (YYYY-MM-DD) <fact>". -->
- (2026-08-18) Prescreen inbound mail to zachary.ferguson.automations@gmail.com. ALLOW if the sender is on the Active PDI Health report allowlist at /home/box/agent-data/agents/79034e4c-c809-4e00-aefd-dd9ac8c00a28/pdi-active-allowlist.txt (408 addresses, case-insensitive), or pdimdxray@gmail.com (Rich Berry), or zachary.ferguson.authority@gmail.com. BLOCK no-reply, security alerts, Google marketing, Drive-share bots, and automated mail. HOLD human senders not on the allowlist. Never draft or send mail. Never e
- (2026-08-18) pdihealth.com SPF is v=spf1 include:spf.protection.outlook.com include:amazonses.com -all. MX is Outlook. DMARC is p=none, so a spoofed @pdihealth.com From can still land in inbox. Do not ALLOW on From/allowlist alone. Check Gmail Authentication-Results. BLOCK on dmarc=fail or SPF+DKIM fail or From not aligned with the authenticated domain. HOLD if headers cannot be read. Never reply to spoofed mail.
