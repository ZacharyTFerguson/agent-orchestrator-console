---
name: Open vehicle in eFleets
description: >-
  Use when you need to open a vehicle’s Enterprise eFleets page from the PDI
  oil-change spreadsheet.
---
# Open vehicle in eFleets

Open a vehicle’s Enterprise Fleet Management page from the PDI oil-change Google Sheet.

## Inputs
- `{vehicle}`: the row to open (VA number, driver name, or plate)

## Assumptions
- The browser is signed in to Google as an account that can open the sheet.
- eFleets login lives in the browser profile. Never type or store credentials. If Client Login appears, hand the box the user to sign in, then continue.

## Default sheet
- Working copy: [Automations Copy of PDI - Oil change spreadsheet updated](https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit?gid=238877517#gid=238877517)
- Tab: Oil Change Summary (`gid=238877517`)
- Do not edit the original template (`1eaz_NlsJ9mohfjR3l61piTQOwuMAjVfqDsC0o4Kftss`). Copy first if you need a writable sheet.

## Steps
1. Open the working copy on Oil Change Summary.
2. Find the `{vehicle}` row. Column A names are rich-text links (plain text in the formula bar, not `=HYPERLINK`).
3. Click the vehicle name. Sheets redirects through `google.com/url` to `https://login.efleets.com/fleetweb/vehicle/{id}`.
4. If the page is `https://login.efleets.com/fleetweb/login`, stop and have the user sign in on the box. After they hand it back, reopen the vehicle URL.
5. Report the vehicle page URL and the useful fields on screen (mileage, last service, due dates). Do not change or submit anything in eFleets unless the user asked.

## Notes
- Drive’s file-read tools show row text, not the link target. Get the URL from the sheet UI (hover or click).
- Example from the demo: VA 7 Office Vehicle (plate TMG1104) → `https://login.efleets.com/fleetweb/vehicle/27CKN7`
