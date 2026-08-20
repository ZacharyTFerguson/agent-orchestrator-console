# agent-orchestrator-console

Configurable Multi-Agent Orchestrator Console with chat, cron, heartbeats and SQLite persistence.

## GrokBot archive (2026-08-20)

This repo includes a **GrokBot archive** migrated from Google Drive for use with **Cursor Cloud Agents**. The dump preserves agent personalities, workflow skills, standing rules, routines, and memory from the paused GrokBot team (August 2026).

### Layout

| Path | Contents |
|------|----------|
| [`grokbot-archive/`](grokbot-archive/) | Full mirror of the Drive dump: README, Personalities, Skills, Routines, Memory & rules, Work snapshot |
| [`.cursor/skills/`](.cursor/skills/) | 14 workflow skills as Cursor skill folders (`SKILL.md` each) |
| [`.cursor/rules/grokbot-standing-rules.mdc`](.cursor/rules/grokbot-standing-rules.mdc) | Always-on standing rules from `STATUS.md` (holds, vacation send, pairing writers, card homes) |
| [`.cursor/agents/`](.cursor/agents/) | One agent definition per Grok personality |
| [`grokbot-archive/Routines/`](grokbot-archive/Routines/) | Grok automation definitions (inbox check, prescreen, oil updater, resume hourly) — map to Cursor Automations manually |

Re-run [`scripts/migrate_grokbot.py`](scripts/migrate_grokbot.py) after editing archive skills or personalities to refresh `.cursor/skills/` and `.cursor/agents/`.

### Resume pointers

- Standing rules and holds: `grokbot-archive/Memory & rules/STATUS.md` and `.cursor/rules/grokbot-standing-rules.mdc`
- PDI email allowlist: `grokbot-archive/Memory & rules/pdi-active-allowlist.txt`
- Original Grok paths (`/home/box/...`) are preserved in skill and agent files for reference
