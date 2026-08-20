---
name: prescreen-inbound-email
description: >-
  Use when deciding whether internet bot may reply to an inbound email. Screen
  the sender before drafting.
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Prescreen inbound email

Before drafting or sending a reply from zachary.ferguson.automations@gmail.com:

1. Pass sender, subject, and snippet to internet bot prescreen.
2. Wait for allow, hold, or block.
3. Allowlist only: zachary.ferguson@pdihealth.com, pdimdxray@gmail.com, zachary.ferguson.authority@gmail.com.
4. Block automated or no-reply mail. Hold unknown humans. Do not reply on hold or block.
5. On allow, draft, then send the draft through internet bot review before sending.
