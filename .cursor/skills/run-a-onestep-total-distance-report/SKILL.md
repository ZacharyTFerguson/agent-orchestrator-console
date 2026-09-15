---
name: run-a-onestep-total-distance-report
description: >-
  Use when generating a OneStepGPS Total Distance report from the signed-in
  portal, including a specific device or group and a custom date range.
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Run a OneStep Total Distance report

Assumes Chrome is already signed in to OneStepGPS as the PDI Health user (`track.onestepgps.com`). Do not type passwords.

Keep volume low: only a couple of OneStep report RUNs per day unless Zachary asks for a specific one.

## Inputs
- `{scope}` — devices to include. Default **every device** unless a unit or group is named. Demonstrated: **SPECIFIC DEVICES** with the **VA** group checked (2 devices / 1 group).
- `{time_range}` — one-time window. Default **today in Eastern Time** unless a start/end is named. Demonstrated picker: start `08/10/2026 5:33AM`, end `08/20/2026 11:59PM`, timezone **Eastern Time (EST/EDT)**.

## Steps
1. Open [OneStep Reports](https://track.onestepgps.com/v3/ux/reports/dashboard) (sidebar **Reports**). Stay on the **NEW REPORTS** tab.
2. Open **Total Distance** (`https://track.onestepgps.com/v3/ux/reports/edit/new?type=total_distance&from=dashboard`). Title is **Total Distance** (“Shows total distance driven”).
3. **Configure Report**
   - **EVERY DEVICE** unless `{scope}` is specific.
   - For a unit or group: click **SPECIFIC DEVICES**. In the modal, search if needed (spaces, commas, or newlines). Check the named group on the left (counts show how many devices are in it) or individual devices on the right. Confirm the footer **Devices Selected** / **Groups Selected**, then **SAVE**. **CANCEL** leaves the previous scope.
4. Optional refine: **COLUMNS** / **OPTIONS** / **LAYOUT SETTINGS**. Change these only if asked.
5. **Report Scheduling:** leave **ONE TIME**. Open the **Time Range** picker, set start and end to `{time_range}`, keep timezone **Eastern Time (EST/EDT)** unless told otherwise. Do not switch to **SCHEDULE** unless asked.
6. Click **RUN**. A green banner **Report generating in background** is the success signal. Do not click **CANCEL** after RUN.
7. Open **GENERATED REPORTS** (`https://track.onestepgps.com/v3/ux/reports/generated`). Confirm a new **Total Distance** row with the requested range (generated reports expire in about 3 months). Use **REFRESH** if the new row is missing.

## Report
- Scope (every device, or which groups/devices)
- Time range and timezone
- Whether RUN succeeded (banner and Generated Reports row)
- The generated row’s timestamp if visible
- Do not download or email the file unless asked

## Do not
- Do not use the History map for this (that is a different workflow)
- Do not save or schedule a repeating report unless asked
- Do not change column layout unless asked
- Do not write the Automations Google Sheet unless asked
- Do not blast several RUNs in one day
