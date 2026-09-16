# Oil-fleet MCP — attach it so Cloud Agents can use the light APIs

This repo ships a **stdio** MCP named `oil-fleet`. It wraps the native-fetch clients in `server/src/clients/` (Sheets v4, sourced OneStep paths, eFleets export parser). No `googleapis`, no Chrome.

This Cloud Agent run already has **Google Drive**, **Gmail**, and **ClickUp**. Drive can export the working sheet as CSV. Drive cannot write cells. `oil-fleet` is the cell-write / OneStep / due-list tool layer.

The environment’s working spreadsheet is pinned in `config/oil-sheet.json`:

https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit?gid=733911326#gid=733911326

(`Automations Copy` → **eFleets All Cars sorted**). Override with `OIL_CHANGE_SHEET_ID` / `OIL_CHANGE_SHEET_GID` / `OIL_CHANGE_SHEET_TAB` only if you intentionally switch copies.

Cursor does **not** auto-load `.cursor/mcp.json` into Cloud Agents. You attach servers in the Cloud Agents MCP list (`+` → **MCP Servers** on this run). HTTP MCP is Cursor’s preferred Cloud transport (credentials stay off the VM). `oil-fleet` is stdio because we are not hosting a public HTTP endpoint.

## Composio Connect (Sheets cell access)

Hosted MCP: [https://connect.composio.dev/mcp](https://connect.composio.dev/mcp)

This is streamable HTTP. Unauthenticated calls return `401` and advertise OAuth at `https://login.composio.dev` (or an `x-consumer-api-key` header). The Cursor catalog **Composio** row on this run is a different attachment; it stayed `needsAuth` and is not this URL.

### Cloud Agents (this run)

1. Open [this run](https://cursor.com/agents/bc-4087ff70-b35a-4807-a261-fda00acbea59).
2. Click **`+`** left of the follow-up box → **MCP Servers** → **Add MCP**.
3. Type **HTTP**. URL exactly `https://connect.composio.dev/mcp`. Name `composio`.
4. Complete Composio login in the browser. When it asks to connect Google Sheets, use `zachary.ferguson.automations@gmail.com` or `zachary.ferguson.authority@gmail.com`.
5. Stay on this run and tell the agent Composio Connect is attached.

Do not paste API keys into chat. Optional Desktop header: `x-consumer-api-key` from [dashboard.composio.dev](https://dashboard.composio.dev) → **AI Clients**. Cloud can use the OAuth challenge instead of a key.

`.cursor/mcp.json` already lists this URL for the IDE. Cloud still needs the **Add MCP** step above.

## Tools

| Tool | What it does |
|---|---|
| `oil_status` | Configured flags only. Never returns tokens. |
| `oil_due_list` | CHANGE OIL AFTER 5K report (Sheets token or CSV). |
| `sheets_get_values` | Official Sheets `values.get`. |
| `sheets_update_values` | Official Sheets `values.update`. Blocks original PDI template and columns I/J. |
| `onestep_devices` | `GET /v3/api/public/device` (JWT if `ONESTEP_PRIVATE_KEY` is set) |
| `onestep_miles_since` | Drive-stop miles; rejects OneStep odometer. |
| `compose_last_reading` | Enterprise odo + OneStep miles since T. |

## Desktop / IDE (already in the repo)

`.cursor/mcp.json` points at `node ${workspaceFolder}/server/src/mcp/oil-mcp.js`. Secrets come from your shell env via `${env:NAME}` — nothing is committed.

Set the vars locally if you have them (do not paste them into chat):

```bash
export GOOGLE_SHEETS_ACCESS_TOKEN=...   # write + private read
export ONESTEP_API_KEY=...              # already on file is fine
```

Then enable **oil-fleet** under Customize → MCP.

## Cloud Agents (required for this agent)

1. Open [cursor.com/agents](https://cursor.com/agents) → MCP dropdown → add a **custom stdio** server.
2. Use these fields (cwd is the repo root):

| Field | Value |
|---|---|
| Name | `oil-fleet` |
| Type | `stdio` |
| Command | `node` |
| Args | `server/src/mcp/oil-mcp.js` |

3. Put secrets on the **environment**, not in the command string. Names:

- `GOOGLE_SHEETS_ACCESS_TOKEN` (optional if you only need Drive CSV export)
- `GOOGLE_SHEETS_API_KEY` (optional public read)
- `ONESTEP_API_KEY` (optional; protected keys need the private key too)
- `ONESTEP_PRIVATE_KEY` (optional RSA PEM for RS256 JWT wrap)
- `ONESTEP_BEARER_TOKEN` (optional pre-signed JWT)

4. Start a **new** Cloud Agent (or re-enable the server on this run) after saving. This current run cannot see a server that was not attached when it booted.

Team admins can add the same server under **Dashboard → Integrations & MCP** so every agent gets it.

Do **not** add an eFleets login MCP. There is no customer REST API, and this app does not store portal passwords.

## Smoke test without Cursor

```bash
npm test                 # includes MCP protocol tests
npm run oil-mcp          # stdio server; Cursor talks to this
```
