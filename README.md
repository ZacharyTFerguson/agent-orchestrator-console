# agent-orchestrator-console

Configurable Multi-Agent Orchestrator Console with chat, cron, heartbeats and SQLite persistence.

A small full-stack app that lets you watch and interact with a configurable line-up of agents:

- **Chat** – send messages to a single agent or broadcast to all; replies stream back live over WebSockets.
- **Cron** – each agent runs a scheduled task defined by a cron expression.
- **Heartbeats** – each agent emits a liveness ping on its own interval; the console shows `alive`/`stale` status.
- **SQLite persistence** – agents, messages, heartbeats and cron runs are stored in SQLite (via `better-sqlite3`).

## Stack

- **Server** – Node.js + Express + `ws` + `node-cron` + `better-sqlite3` (`server/`)
- **Web** – React + Vite console (`web/`)
- **Config** – agent line-up in [`config/orchestrator.config.json`](config/orchestrator.config.json)

## Requirements

- Node.js >= 20 (developed on Node 22)

## Getting started

```bash
npm install            # installs server + web workspaces
npm run dev            # API on :4000, Vite console on :5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/ws` to the API on port 4000.

### Production-style run

```bash
npm run build          # build the web console into web/dist
npm start              # API serves the built console on :4000
```

## Configuration

Edit [`config/orchestrator.config.json`](config/orchestrator.config.json) to change the agent line-up. Each agent supports:

| Field | Meaning |
| --- | --- |
| `id` | Unique agent id |
| `name` / `role` / `emoji` | Display metadata |
| `heartbeatSeconds` | Heartbeat interval |
| `cron` | Cron expression for the scheduled task |
| `cronTask` | Description recorded on each scheduled run |

Point the server at a different file with `ORCHESTRATOR_CONFIG=/path/to/config.json`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/config` | Console config + agent status |
| GET | `/api/agents` | Agent status (with heartbeat liveness) |
| GET | `/api/messages` | Recent chat messages |
| GET | `/api/cron` | Recent cron runs |
| GET | `/api/heartbeats` | Recent heartbeats |
| POST | `/api/chat` | `{ text, agentId? }` – send a message |
| POST | `/api/agents/:id/run` | Trigger an agent's task now |

## Tests

```bash
npm test               # node:test suite for the orchestrator core
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `WEB_PORT` | `5173` | Vite dev port |
| `API_TARGET` | `http://localhost:4000` | Vite proxy target |
| `DB_PATH` | `data/orchestrator.db` | SQLite file (`:memory:` for tests) |
| `ORCHESTRATOR_CONFIG` | `config/orchestrator.config.json` | Agent config path |

## See also

Workstation collab map (three planes; **not** LightDicomReader; this app does not open DICOM studies). In-app chat replies are canned templates (`#composeReply`), not an LLM bus: [docs/collab/README.md](docs/collab/README.md).

<!-- GROKBOT_BEGIN -->
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
<!-- GROKBOT_END -->
