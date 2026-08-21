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
| --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/config` | Console config + agent status |
| GET | `/api/agents` | Agent status (with heartbeat liveness) |
| GET | `/api/messages` | Recent chat messages |
| GET | `/api/cron` | Recent cron runs |
| GET | `/api/heartbeats` | Recent heartbeats |
| POST | `/api/chat` | `{ text, agentId? }` – send a message |
| POST | `/api/agents/:id/run` | Trigger an agent's task now |
| GET | `/api/oil-changes` | Latest CHANGE OIL AFTER 5K due-list (took over from GrokBot) |
| POST | `/api/oil-changes/run` | Rebuild the due-list from Sheets API, `OIL_CHANGE_CSV_PATH`, or `data/efleets-all-cars.csv` |
| GET | `/api/integrations` | Light Sheets / OneStep / eFleets status (configured flags only) |

## Tests

```bash
npm test               # node:test suite for the orchestrator core
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- |
| `PORT` | `4000` | API port |
| `WEB_PORT` | `5173` | Vite dev port |
| `API_TARGET` | `http://localhost:4000` | Vite proxy target |
| `DB_PATH` | `data/orchestrator.db` | SQLite file (`:memory:` for tests) |
| `ORCHESTRATOR_CONFIG` | `config/orchestrator.config.json` | Agent config path |
| `OIL_CHANGE_CSV_PATH` | `data/efleets-all-cars.csv` or sample fixture | Export of Automations **eFleets All Cars sorted**. Do not commit the live fleet file. |
| `GOOGLE_SHEETS_ACCESS_TOKEN` | unset | Sheets API v4 Bearer token (read/write). When set, the due-list loads the working tab over HTTPS. |
| `GOOGLE_SHEETS_API_KEY` | unset | Sheets API key for public read-only sheets. |
| `ONESTEP_API_KEY` | unset | OneStep public `api-key`. Never commit or log it. |
| `ONESTEP_BEARER_TOKEN` | unset | Optional OneStep JWT. |

## See also

Workstation collab map (three planes; **not** LightDicomReader; this app does not open DICOM studies). In-app chat replies are canned templates (`#composeReply`), not an LLM bus — except the oil-change agents, which return the real 5K due-list: [docs/collab/README.md](docs/collab/README.md) · [docs/collab/OIL-CHANGES.md](docs/collab/OIL-CHANGES.md) · [docs/collab/APIS.md](docs/collab/APIS.md) · [docs/collab/MCP.md](docs/collab/MCP.md).

The `oil-fleet` MCP (`.cursor/mcp.json`) exposes those light clients to Cursor. Cloud Agents must also add the same stdio server in the [agents MCP dropdown](https://cursor.com/agents).
