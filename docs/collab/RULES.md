# Collab rules — Cursor owns this app

Cursor team owns the Node app. Sibling trees (`../dicomlight`, `../orchestrator`) add **docs that tell the truth**. The Python hub stays next door. **Wire ≠ own.**

**Not the viewer.** This repository does not open DICOM studies. Do not put patient files here.

## Names stay distinct

| Brand | Meaning |
|-------|---------|
| **LightDicomReader** | Go/Fyne clinical viewer in `../dicomlight` |
| **Agent Control** | Product watchdog UI (`../dicomlight/cmd/watchdogui`, `:8787`) |
| **Orchestrator Domain** | Python hub in `../orchestrator` (not a git repo) |
| **agent-orchestrator-console** | **This** GitHub Node/React demo |

Do **not** subtitle this Node app “Agent Control.” Do **not** call Agent Control “the orchestrator console.” Do **not** call the hub “the viewer dashboard.”

## Cursor scaffold freeze

Keep `server/`, `web/`, `config/`, `.cursor/`, workspaces `package.json`, lockfile, and the existing README getting-started / API / env tables.

| Freeze | Meaning |
|--------|---------|
| **Cursor owns C** | Do not replace the Node app with the Python hub. |
| **PR #1 is the scaffold** | Authored by `cursoragent`; merged to `main`. Do not revert it. |
| **Cloud Agent env** | `.cursor/environment.json` is highest-precedence — leave it. Ports stay **5173 / 4000**. Never add 8787 there. Do not add extra `.cursor/*` files that change Cloud Agent boot. |
| **Additive docs** | New files under `docs/collab/`. One short README “See also” **after** the env-var table. Default: **do not touch** `server/src`, `web/src`, `config/`. |
| **No glass CSS** | Do not copy hub `dashboard/static/{index.html,app.js,styles.css}` into `web/`. Do not merge glass, Agent Control, and Vite into one process or one CSS. |

Default Node roster (do not rewrite unless a later collab cycle dual-reviews it): Planner / Researcher / Executor with 1–2 minute cron strings in `config/orchestrator.config.json`.

## Wire ≠ own

The Python hub **coordinates** siblings. It does **not** own `cmd/viewer/` or this Node scaffold.

- Describe `../orchestrator`. Do **not** copy Python/Go hub trees into this repo.
- Product law wins in `../dicomlight` (viewer, goldens, corpus originals).
- Hub `codebases.json` is an ungitted hub file — do not register this clone there as part of a GitHub commit.
- Plane B is **not a git repo**. You cannot “commit the hub.”

## Prompt buses

| Plane | Bus | Honest fact |
|-------|-----|-------------|
| **A · Product** | `../dicomlight/tools/RESUME.prompt.txt` + `orchestration/NEXT-AGENT.prompt.md` | Real spawn law. |
| **B · Hub** | `../orchestrator/agents/sessions/` | Real hub sessions. |
| **C · this repo** | **None** | POST `/api/chat` stores a user row and a canned `#composeReply` row. |

Do not treat `data/orchestrator.db` as a schedule. Cursor Cloud Agents (`.cursor/environment.json`) are **not** the in-app Planner / Researcher / Executor demo agents.

## OWNER-PAUSE lives in dicomlight

Thousand Features / YOLO / `OWNER-PAUSE` are **dicomlight product law** (`../dicomlight/tools/OWNER-PAUSE`).

- This Node repo does **not** carry the pause file.
- Do **not** add a `tools/OWNER-PAUSE` file here.
- Do **not** start TF or YOLO from this clone.
- Do **not** rewrite product `RESUME` into a YOLO chain.
- Hub `dl assign` must refuse while the product pause file exists — do not fight that.

From this clone, do **not** run `go test ./cmd/viewer/`, do not `dl assign`, do not start YOLO. Siblings may be absent on a Cloud Agent VM.

## SHOULD add (collab pack)

| Path | Purpose |
|------|---------|
| `docs/collab/README.md` | Index: **Not the viewer**, canned-chat honesty, four brands, combined goal, links |
| `docs/collab/PLANES.md` | Three planes, Agent Control cousin, ports, operator chooser / look-here, prompt bus |
| `docs/collab/RULES.md` | This file |
| `README.md` | One additive “See also” after the Environment variables table. Do **not** replace getting-started, API table, or env-var table |

`.gitignore` already ignores `data/`, `*.db`, WAL sidecars. Leave it unless a later cycle dual-reviews a comment-only change.

## MUST NOT add / MUST NOT do

- Replace the Node app with the Python hub (`backend/`, `dashboard/static/`, `AgentOrchestratorConsole.py`, `cmd/swarm`).
- Copy `messages.db`, swarm instance DBs, `review-runs/`, live hub `config.json`, live `codebases.json`.
- Copy secrets, API keys, pid files, patient files, dicomlight **corpus**, `cmd/viewer` source.
- Commit PHI or real study paths (none belong in this public repo).
- Overwrite `.cursor/environment.json`, `server/src/*`, `web/src/App.jsx` in this collab (docs-only default).
- `git add` `*.db` (including `data/orchestrator.db` and any stray `messages.db`).
- Invent ghost APIs on the Node server (`/api/dicomlight/*`, SSE `/api/stream`).
- Claim Node chat is a real multi-agent LLM bus.
- Invent a LICENSE / CODEOWNERS (absent today — do not fabricate).
- Call this Node app “Agent Control.”
- Copy campaign cycle graphs, reviewer seat names as CODEOWNERS, or workstation home paths into this pack.

## Public-safe copy

Lift **Not-the-viewer banner, four-brand names, combined goal, plane map, ports, operator chooser, prompt bus, these rules**. Sibling paths only: `../dicomlight`, `../orchestrator`. No absolute home paths. No PHI.
