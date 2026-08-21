# Collab map — not the viewer

**This repository is not LightDicomReader.** It does **not** open CD/USB studies, decode PixelData, show a first frame, or accept patient files. The DICOM viewer is a separate Go/Fyne product in the sibling tree `../dicomlight` (`cmd/viewer/`). Do not put patient files here.

This repo (`agent-orchestrator-console`) is a **Cursor team** Node/React **demo console**: chat, cron strings, heartbeats, SQLite. It is **not** Agent Control. It is **not** the Python Orchestrator Domain hub.

## Honesty (canned chat)

In-app “chat” replies are **canned templates** (`#composeReply` in `server/src/orchestrator.js`), not an LLM bus, not Cursor Cloud Agent runtime, and not a Grok spawn. Cron **records** a `cronTask` string; it does not run product tests or a shell.

Cursor Cloud Agents (`.cursor/environment.json`) are a **separate** Cursor product feature. They are not the in-app Planner / Researcher / Executor demo agents.

## Four brands (keep distinct)

| Brand | Where | Who it is for |
|-------|--------|----------------|
| **LightDicomReader** | `../dicomlight` · `cmd/viewer/` | Clinician — open a study |
| **Agent Control** | `../dicomlight` · `cmd/watchdogui` · `:8787` | Owner of **product** agent hops |
| **Orchestrator Domain** | sibling `../orchestrator` (not a git repo) | Owner of **multi-codebase** wire |
| **agent-orchestrator-console** | **this** GitHub Node app · `:5173` / `:4000` | Cursor team + demo |

Do **not** call this Node app “Agent Control.” Do **not** call Agent Control “the orchestrator console.” Do **not** call the hub “the viewer dashboard.”

## Combined goal (control planes only)

Configurable multi-agent control: watch agents, chat/broadcast, cron, heartbeats, SQLite history, honest live UI.

**One vocabulary, three jobs — not one product.** That goal does **not** apply to opening a study.

Three surfaces already exist. **Do not smash them into one repo.**

| Plane | Sibling / this tree | Role |
|-------|---------------------|------|
| **A · Product** | `../dicomlight` | Ships the **Fyne viewer**. Law lives there. |
| **B · Python hub** | `../orchestrator` | Wires siblings. **Wire ≠ own.** Not a git repo. |
| **C · Cursor console** | **this repository** | Demo chat · cron · heartbeats · SQLite. Cursor team owns it. |

Product **Agent Control** is a **cousin** on `:8787`, not a fourth orchestrator plane. Hub glass also uses `:8787`. This Node app does **not**.

Siblings `../dicomlight` and `../orchestrator` are **workstation-local**, not git submodules. They may be absent on a Cursor Cloud Agent VM. **From this clone, do not run** `go test ./cmd/viewer/`, do not `dl assign`, do not start YOLO.

## See also (this pack)

- [PLANES.md](PLANES.md) — three planes, Agent Control cousin, ports, operator look-here
- [RULES.md](RULES.md) — SHOULD / MUST NOT, Cursor scaffold freeze, prompt buses, `OWNER-PAUSE`
- [OIL-CHANGES.md](OIL-CHANGES.md) — Cursor took the GrokBot 5K due-list; live export path and leftover eFleets/OneStep writes
- [APIS.md](APIS.md) — light Sheets / OneStep / eFleets clients (no googleapis, no Chrome)
- [MCP.md](MCP.md) — attach the `oil-fleet` MCP in Desktop and Cloud Agents

Sibling operator guides (workstation-local; may be absent on a Cloud Agent VM) — **by name, not copied**:

- Cursor getting-started: repo root [README.md](../../README.md) (do not replace it)
- Product map: `../dicomlight/docs/AGENT-ORCHESTRATOR.md`
- Agent Control: `../dicomlight/docs/AGENT-CONTROL.md`
- Hub glass: `../orchestrator/docs/DASHBOARD.md`
