# Planes — three orchestrators, one cousin

**Not the viewer.** None of these surfaces open a DICOM study. LightDicomReader is the Fyne window in `../dicomlight` (`cmd/viewer/`). This GitHub repo does not decode PixelData and must not receive patient files.

**One vocabulary, three jobs — not one product.** Shared words (chat, cron, heartbeats, SQLite) do not mean a shared clinical job.

Do **not** smash these into one repo.

## Three planes

| | **A · Product** | **B · Python hub** | **C · Cursor console** |
|--|-----------------|--------------------|------------------------|
| **Brand** | LightDicomReader / `dicomlight` | Orchestrator Domain | `agent-orchestrator-console` |
| **Path (from this repo)** | `../dicomlight` | `../orchestrator` | **this repository** (`.`) |
| **Git** | Product git tree | **Not a git repo** | https://github.com/ZacharyTFerguson/agent-orchestrator-console · `main` |
| **Owner** | Product law · Grok seats | Hub DOMAIN owner · **wire ≠ own** | **Cursor team** (PR #1 scaffold · `cursoragent`) |
| **Stack** | Go · Fyne viewer `cmd/viewer/` · Agent Control `cmd/watchdogui` | Python `backend/` + glass `dashboard/static/` + Go `cmd/swarm` · SQLite | Node ≥20 workspaces `server` + `web` · Express · `ws` · `node-cron` · `better-sqlite3` · React + Vite |
| **UI / ports** | Clinical UI = **Fyne window** (no orchestrator port). Cousin Agent Control **:8787** (see below) | Glass **http://127.0.0.1:8787/** · SSE `/api/stream` | Dev Vite **:5173** (proxies `/api` + `/ws`) · API **:4000** |
| **Live transport** | HTTP dashboard for YOLO / pause (cousin) | **SSE** + `POST /api/command` | **WebSocket `/ws`** + REST |
| **Demo roster** | Product teams 1–16 | Glass 8 + hub (Luna … Echo) | Config ids `planner` · `researcher` · `executor` |
| **Persistence** | Product files (RESUME, boards) | Hub `messages.db` (local, never commit) | `data/orchestrator.db` (gitignored) |
| **Health gate** | `go test` in the **product** tree — **do not run from this clone** | `pytest -q` in `../orchestrator` | `npm test` in **this** repo |
| **Prompt bus** | `tools/RESUME.prompt.txt` + `orchestration/NEXT-AGENT.prompt.md` | `agents/sessions/` | **None.** Canned `#composeReply` |
| **dicomlight plane** | Law lives there | `backend/dicomlight/` · `dl *` · lease/gate | **Absent** — no `/api/dicomlight/*`, no `wire` / `job` |

Rosters **do not map 1:1**. “Researcher” in this repo is a demo card, not a product seat and not a radiology workflow. **None** of the Node demo agents decode DICOM.

## Agent Control cousin (not plane C, not plane D)

Product **Agent Control** (`../dicomlight/cmd/watchdogui`) also binds **:8787**. It is a **fourth surface**, not a fourth orchestrator plane: YOLO / continue-watchdog / `OWNER-PAUSE` for the **viewer** tree.

| Shared | Split |
|--------|--------|
| Local HTTP on **8787** (hub glass **and** Agent Control clash if both up) | Hub `pytest` vs product `go test` vs Node `npm test` |
| Honor `../dicomlight/tools/OWNER-PAUSE` | Product RESUME lives **only** in dicomlight |
| Prompt → handoff law | Hub sessions live under `../orchestrator/agents/sessions/` |

**Never run** the Python glass dashboard and Agent Control on the same host port at the same time. **This Node app does not use 8787.**

## Port table

| Port | Who | What |
|------|-----|------|
| **5173** | Cursor Vite console | Dev UI; proxies `/api` and `/ws` to :4000 |
| **4000** | Cursor Express API | REST + WebSocket; production-style `npm start` serves `web/dist` here |
| **8787** | Python hub glass | SSE live dashboard |
| **8787** | dicomlight Agent Control | Product watchdog UI — **same port, different process** |

Do not imply 8787 is unique. Do not imply this Node app listens on 8787.

| Operator action | Tab that shows the React UI | Tab that is API-only |
|-----------------|-----------------------------|----------------------|
| `npm run dev` (Vite + API) | **5173** | **4000** unless an old `web/dist` happens to exist |
| `npm run build` then `npm start` | **4000** (static `web/dist`) | — (no Vite; 5173 not running) |

Prefer **localhost / 127.0.0.1** in operator docs, not a LAN IP.

## Operator chooser (what to open when)

| Brand | Open this | To do this | Do not use it for |
|-------|-----------|------------|-------------------|
| **LightDicomReader** | Fyne window (`../dicomlight/cmd/viewer/`) | Open a study · first picture · W/L · cine | Starting YOLO, hub `dl *`, Cursor demo chat |
| **Agent Control** | `http://127.0.0.1:8787/` (`../dicomlight/cmd/watchdogui`) | Product YOLO / watchdog / `OWNER-PAUSE` for the viewer tree | Viewing DICOM; hub glass; this Vite console |
| **Orchestrator Domain** (Python hub) | `http://127.0.0.1:8787/` (`../orchestrator`) | Wire siblings, `dl *`, SSE swarm | Product pause/start (wrong process); this demo |
| **agent-orchestrator-console** (this repo) | Dev `http://localhost:5173` · prod-style `http://localhost:4000` | Demo chat · cron strings · heartbeats | Spawning Grok, `go test ./cmd/viewer/`, opening a CD |

**8787 recovery:** Hub glass and Agent Control **share 8787**; bind is `127.0.0.1:8787`. Never run both on the same host port. If the wrong dashboard appears (glass swarm chips vs product watchdog), **stop the other 8787 process**. Quitting this Node app will not free 8787.

## Look-here (URL + brand + pill)

| If you want | Open | You should see | Wrong tab if you see |
|-------------|------|----------------|----------------------|
| **Cursor console (dev)** | http://localhost:5173 | Brand **Agent Orchestrator Console**; pill **live** / **offline**; three cards Planner / Researcher / Executor; panels Agents · Chat · Activity | **SSE live**, N/M agents, **Wire dicomlight**, command bar, port **8787** |
| **Cursor API** | http://localhost:4000 | JSON `/api/health` during `npm run dev` (no Vite UI unless `web/dist` exists). After `npm run build` && `npm start`, **same React UI** as 5173 | Do not treat :4000 as the dev GUI |
| **Python hub glass** | http://127.0.0.1:8787/ | Brand **Grok Swarm Orchestrator**; pill **SSE live**; **N/M agents active**; footer command bar; `dl *` chips | React 3-panel chat; **live/offline** pill; Planner/Researcher/Executor-only roster |
| **Product Agent Control** | http://127.0.0.1:8787/ | Watchdog / YOLO / pause dashboard in the **dicomlight** tree | Glass swarm chips. **Never** with hub glass on the same port |

**Pill honesty**

- Cursor **live** = WebSocket `/ws` connected to the Node API. Not an LLM. Not Cursor Cloud Agents. Not Grok.
- Cursor agent **alive** / **stale** = heartbeat recency on demo roster ids. Not product Team 1–16.
- Hub **SSE live** = EventSource `/api/stream`. Different transport; do not write SSE into `web/`.
- Empty Cursor chat copy (“Say hello to your agents”) is a **template** round-trip (`POST /api/chat` → canned `#composeReply`).

**Start lines** (docs only; do not invent scripts; do not auto-open a browser):

```text
Cursor:         (this repository) npm run dev                               → look at :5173
Hub:            (sibling ../orchestrator) python3 tools/dashboard_server.py --seed --port 8787 → look at :8787
Agent Control:  (sibling ../dicomlight) cmd/watchdogui                      → also :8787, not together with hub
```

Print the URL; let the operator click.

## Prompt bus (three answers, not one)

Every owner instruction becomes a **file**, then a worker — **on planes that actually spawn agents.**

| Where the work is | Write this | Then |
|-------------------|------------|------|
| **A · Product** | `../dicomlight/tools/RESUME.prompt.txt` (+ `orchestration/NEXT-AGENT.prompt.md`) | Spawn / chain under product `AGENTS.md`. TF/YOLO off while `OWNER-PAUSE` exists. |
| **B · Hub** | `../orchestrator/agents/sessions/YYYY-MM-DD-<slug>.md` | Hub worker; `pytest -q` if hub code moved |
| **A+B dual** | **Both** | Hub law for hub files; product law for `cmd/viewer/` |
| **C · this repo** | **No prompt bus.** Chat POST `/api/chat` stores a user row and a canned agent row | Do not treat `data/orchestrator.db` as a schedule |

## Honest differences (do not paper over)

| Topic | A Product | B Hub | C this Node app |
|-------|-----------|-------|------------------|
| **Job** | Ship the **viewer** (time-to-first-image, CD/USB, offline) | **Coordinate** siblings. `wire` / `job` / `dl *`. Does not own `cmd/viewer`. | **Demo console** for chat / cron / HB. Does not schedule dicomlight or spawn Grok. |
| **Chat** | Owner → **prompt file** → spawn | `send` / `broadcast` persisted; command bar is real hub ops | User message + **template** `{emoji} {name} here. On it — … I'll handle: "{text}".` |
| **Opens DICOM?** | **Yes** (Fyne viewer) | No | No |
| **Cron** | Product CHARTER / YOLO (may be paused) | Hub cron + swarm | `node-cron` records a **string** (`cronTask`); no shell |
| **Git / ship** | Product `releases/` | Ungitted local hub — **cannot** “commit the hub” | Public GitHub; Cursor owns the scaffold |

**Do not claim:** “this console now runs Grok seats.” **Do not invent** Node routes `/api/dicomlight/*` or SSE `/api/stream`.
