---
name: Import xlsx into Automations
description: >-
  Use when adding a local Excel or CSV as new tabs on the Automations PDI
  oil-change Google Sheet without replacing existing tabs.
---
# Import xlsx into Automations

Add a local workbook to the working Automations Google Sheet as **new tabs**. Never replace the spreadsheet or the current sheet.

Drive MCP cannot write into an existing Sheet. Do this in signed-in Chrome.

## Inputs
- `{file}` — local `.xlsx` or `.csv` path (example: `/workspace/card-pairing-suspects.xlsx` or `/home/box/Downloads/card-pairing-suspects.xlsx`).
- `{workbook}` — default is **Automations Copy of PDI - Oil change spreadsheet updated**  
  `https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit`

## Do not
- Open or edit the original PDI template (`1eaz_NlsJ9moafjR3l61piTQOwuMAjVfqDsC0o4Kftss`).
- Choose **Replace spreadsheet** or **Replace current sheet**.
- Check **Import theme** (it can restyle Oil Change Summary).
- Paste a path (box clipboard is unreliable). Type or click the file.

## Steps
1. Open `{workbook}` in Chrome. Stay signed in as **zachary.ferguson.automations**. If you hit a login wall, stop and have the user sign in. Never type a password.
2. Confirm the title is the Automations Copy, not the original PDI file and not a standalone upload.
3. **File → Import → Upload**.
4. Click **Browse**. In the Open File dialog, go to the folder that holds `{file}` (often `/workspace` or Downloads). Select `{file}` and Open. Wait until the upload bar finishes.
5. On the Import file dialog, set **Import location** to **Insert new sheet(s)**. The default is often **Create new spreadsheet** — change it. Leave **Import theme** unchecked.
6. Click **Import data**. Wait for the spinner. Do not click Replace anything.
7. Confirm new tabs from `{file}` exist (for the pairing workbook: **Suspects**, **Cross-hits**, **Control VA1**, **Legend**). Existing tabs stay: Oil Change Summary, eFleets All Cars, eFleets All Cars sorted.
8. Click the main new tab (Suspects) and check that the first data rows loaded.

## Report
Workbook URL, new tab names, and that Oil Change Summary was not replaced.
