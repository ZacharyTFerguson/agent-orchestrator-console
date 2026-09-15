---
name: run-a-onestep-daily-operations-report
description: >-
  Use when generating a OneStepGPS Daily Operations report (Drives and Stops,
  Driver Summary, or another New Reports type) from the signed-in portal.
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Run a OneStep Daily Operations report

Assumes Chrome is already signed in to OneStepGPS as the PDI Health user (`track.onestepgps.com`). Do not type passwords.

Keep volume low: only a couple of OneStep report RUNs per day unless Zachary asks for a specific one.

## Inputs
- `{report_type}` — the New Reports name (demonstrated: **Drives and Stops**, then **Driver Summary**). Other Daily Operations names work the same way.
- `{scope}` — who the report covers. Default **every device** (Drives and Stops) or **every driver** (Driver Summary) unless a specific unit/driver is named.
- `{time_range}` — one-time window. Default **today in Eastern Time** unless a start/end is named. Demonstrated Driver Summary field: `08/20/2026 12:00AM - Today`, timezone **Eastern Time (EST/EDT)**.

## Steps
1. Open [OneStep Reports](https://track.onestepgps.com/v3/ux/reports/dashboard) (sidebar **Reports**). Stay on the **NEW REPORTS** tab.
2. Under **Daily Operations**, click `{report_type}`.
   - Drives and Stops URL: `https://track.onestepgps.com/v3/ux/reports/edit/new?type=drives_and_stops&from=dashboard`
   - Driver Summary URL: `https://track.onestepgps.com/v3/ux/reports/edit/new?type=driver_summary&from=dashboard`
3. **Configure Report**
   - Drives and Stops: **EVERY DEVICE** and **EVERY ZONE**, unless `{scope}` is a specific device or zone (**SPECIFIC**).
   - Driver Summary: **EVERY DRIVER**, unless `{scope}` is **SPECIFIC DRIVERS**.
4. Optional refine: **COLUMNS** / **FILTERS** / **OPTIONS** / **LAYOUT SETTINGS**. For Driver Summary, Main Fields include Start Time, End Time, Distance Traveled, Top Speed, Engine Work/Idle/Hours, fuel fields. Change columns only if asked.
5. **Report Scheduling:** leave **ONE TIME**. Set **Time Range** to `{time_range}` and timezone **Eastern Time (EST/EDT)** unless told otherwise. Do not switch to **SCHEDULE** unless asked.
6. Click **RUN**. A green banner **Report generating in background** is the success signal. Do not click **CANCEL** after RUN.
7. Open the **GENERATED REPORTS** tab (`https://track.onestepgps.com/v3/ux/reports/generated` or the dashboard tab). Confirm a new row for `{report_type}` with the requested range. Generated reports expire in about 3 months. Use **REFRESH** if the new row is missing.

## Report
- Report type, scope, time range, timezone
- Whether RUN succeedd (banner and Generated Reports row)
- The generated row’s timestamp if visible
- Do not download or email the file unless asked

## Do not
- Do not use the History map for this (that is a different workflow)
- Do not save or schedule a repeating report unless asked
- Do not change column layout unless asked
- Do not write the Automations Google Sheet unless asked
- Do not blast several RUNs in one day
