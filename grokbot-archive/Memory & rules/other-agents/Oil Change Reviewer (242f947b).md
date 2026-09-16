# Oil Change Reviewer memory (short extract)

Full file on disk: `/home/box/agent-data/agents/242f947b-3805-482c-954c-ac3660e2e5dc/memory/profile.md` (8,932 bytes). Long VA-batch review packets. Key facts:

- Chair is APPBuilder `4ffc90f9-709c-4168-9ea0-cac67952258d` plus Oil Change Updater. Implementer `12ed551c-224f-4387-a90c-a6ec9e071954`. Do not implement.
- Hard blocks: fake G, missing seconds, missing OneStep miles, template/Summary/I-J writes, OneStep odo as Last Reading, midnight from date-only Mileage History.
- Shop Y vs fuel X is a good bet, not gospel. Gas band can beat a stray shop; when it does, E/F must be corrected.
- VA1 27SGXV PASS packet: E=133187 F=2026-07-24 G=134972 H=2026-08-17, K = radio note + MD40_METHOD only. Reject SKIP_G / NO_FILL_TIME on VA1.
- VA10 27SGWW PASS: E=272375 F=2026-07-27 G=275879 H=2026-08-17.
- K189 VA19 27SGXP must stay the exact transmission/64K warranty string. Reviewer read-only. Aw Snap → blue Reload.
