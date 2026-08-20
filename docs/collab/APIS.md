# Light API clients — eFleets, Sheets, OneStep

The oil-change job talks to vendor systems with **native `fetch`**. No `googleapis`, Puppeteer, Chrome, or invented endpoints.

`GET /api/integrations` and `npm run oil-changes -- --integrations` report **configured / not configured** only. Tokens are never logged.

## Google Sheets API v4 (official)

| | |
|---|---|
| Host | `https://sheets.googleapis.com/v4` |
| Read | `GET /spreadsheets/{id}/values/{range}` |
| Write | `PUT /spreadsheets/{id}/values/{range}?valueInputOption=USER_ENTERED` |
| Auth | `Authorization: Bearer` access token, or `key=` API key for public read |
| Client | `server/src/clients/sheets.js` |

Working sheet (only): Automations Copy `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ`, tab **eFleets All Cars sorted**.

Never write the original PDI template `1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`. Never write columns **I/J** (formulas). The client throws before fetch if either is requested.

Set `GOOGLE_SHEETS_ACCESS_TOKEN` (read/write) or `GOOGLE_SHEETS_API_KEY` (public read). When a token is set, `runOilDueListJob` loads the tab over this API instead of a CSV file.

Drive MCP can export the sheet as CSV. It cannot write cells. Cell writes go through this client.

## OneStepGPS public API

Hosted apidoc is behind the portal (`https://track.onestepgps.com`). This repo only calls endpoints already sourced from GrokBot research and the public forum.

| Method | Path | Use |
|---|---|---|
| GET | `/v3/api/public/device` | Device list |
| GET | `/v3/api/public/route/drive-stop` | Miles since a timestamp (this account may 403) |
| GET | `/v3/api/public/report-generated/export/:id` | Generated report file (often empty 200) |

Auth: `api-key` query param, optional `ONESTEP_BEARER_TOKEN`. Client: `server/src/clients/onestep.js`.

**Last Reading** is Enterprise odometer at a known second **plus** OneStep distance since that second (`composeLastReading`). OneStep’s own odometer / Calculated Mileage is never used (`extractDistance` rejects those fields).

Set `ONESTEP_API_KEY` if you already have one. Do not paste the key into chat, git, or logs.

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
