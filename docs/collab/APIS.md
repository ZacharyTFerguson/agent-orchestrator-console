# Light API clients — eFleets, Sheets, OneStep

The oil-change job talks to vendor systems with **native `fetch`**. No `googleapis`, Puppeteer, Chrome, or invented endpoints.

Cloud Agents and the IDE attach those clients as the `oil-fleet` MCP. See [MCP.md](MCP.md). This run already has Drive / Gmail / ClickUp; Drive cannot write sheet cells.

`GET /api/integrations` and `npm run oil-changes -- --integrations` report **configured / not configured** only. Tokens are never logged.

## Google Sheets API v4 (official)

| | |
|---|---|
| Host | `https://sheets.googleapis.com/v4` |
| Read | `GET /spreadsheets/{id}/values/{range}` |
| Write | `PUT /spreadsheets/{id}/values/{range}?valueInputOption=USER_ENTERED` |
| Auth | `Authorization: Bearer` access token, or `key=` API key for public read |
| Client | `server/src/clients/sheets.js` |

Working sheet (only), pinned in `config/oil-sheet.json`: [Automations Copy](https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit?gid=733911326#gid=733911326) tab **eFleets All Cars sorted**.

Never write the original PDI template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`. Never write columns **I/J** (formulas). The client throws before fetch if either is requested.

Set `GOOGLE_SHEETS_ACCESS_TOKEN` (read/write) or `GOOGLE_SHEETS_API_KEY` (public read). When a token is set, `runOilDueListJob` loads the tab over this API instead of a CSV file.

Drive MCP can export the sheet as CSV. It cannot write cells. Cell writes go through this client **or** Composio `GOOGLESHEETS_UPDATE_VALUES_BATCH` (this Cloud run: `zachary.ferguson.automations@gmail.com`, 60 reads/writes per minute). One-shot eFleets CSV updates target the dated copy in `config/oil-update-copy.json`, not the live working sheet. See [EFLEETS-UPDATE.md](EFLEETS-UPDATE.md).

## OneStepGPS public API

Hosted apidoc is behind the portal (`https://track.onestepgps.com`). This repo only calls endpoints already sourced from GrokBot research and the public forum.

| Method | Path | Use |
|---|---|---|
| GET | `/v3/api/public/device` | Device list |
| GET | `/v3/api/public/device-info` | Device info (current portal example) |
| GET | `/v3/api/public/route/drive-stop` | History miles. Required: `device_id`, `dt_tracker_from`, `dt_tracker_to`, `stop_duration` (`5m0s`). Distance is `{value, unit: "mi"}`. Missing params 403. |
| GET | `/v3/api/public/report-generated/export/:id` | Generated report file (often empty 200) |

Auth for **protected** keys: do not send the API key as-is. Sign a fresh RS256 JWT (`access_token` = API key, `exp` ≤ 5 minutes) with `ONESTEP_PRIVATE_KEY`, then `Authorization: Bearer <signed-token>`. Client: `server/src/clients/onestep.js`. Probe: `npm run oil-onestep-probe` (status/counts only).

Legacy unprotected keys may still use the `api-key` query param. Optional `ONESTEP_BEARER_TOKEN` is a pre-signed JWT, not the raw key.

**Last Reading** is Enterprise odometer at a known second **plus** OneStep distance since that second (`composeLastReading`). OneStep’s own odometer / Calculated Mileage is never used (`extractDistance` rejects those fields).

Set `ONESTEP_API_KEY` and `ONESTEP_PRIVATE_KEY` as environment secrets when you want a live pull. Cloud Agents may inject `OneStepAPIKEY` / `OneStepAPIKEYTobeSigned`; the client maps those by PEM shape. Do not paste the key, PEM, or JWT into chat, git, or logs.

## Enterprise eFleets

Enterprise Fleet Management does **not** publish a customer REST API. There is nothing to wrap.

| | |
|---|---|
| Portal | `https://login.efleets.com/fleetweb` |
| Company | `583424` |
| Light path | Portal CSV / XLSX export → `parseFleetCsv` / `parseMileageHistoryExport` |
| Login | Not supported in this app. Do not type or store passwords. |

Mileage History exports use Date / Odometer / Odometer Source / Exception. Shop rows are `MAINTENANCE`, fuel is `FUEL`. Exception rows (`READING ABOVE`, `READING OUT`) are dropped.

Ask the Client Strategy Manager if a partner feed exists. Do not scrape the login page.

History remap / OneStep recapture stays **HOLD**.
