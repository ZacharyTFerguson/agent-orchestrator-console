---
name: fix-last-reading-from-mileage-history
description: >-
  Use when a car’s Last Reading on eFleets All Cars sorted looks wrong or stale.
  Open that vehicle from the sheet, read the latest FUEL odo on Mileage History,
  and write G/H.
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Fix last reading from Mileage History

When a Last Reading on the Automations sheet looks wrong or is not updating, pull that car’s latest **FUEL** odometer from eFleets Mileage History and write it on the same row.

## Fixed

- Workbook: Automations Copy `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ`
- Tab: **eFleets All Cars sorted** (gid `733911326`)
- Stay signed in as zachary.ferguson.automations
- Last Reading = column **G**, reading date = column **H**
- Never write I or J (formulas). Never edit the original PDI template or Oil Change Summary
- Type eFleets ids and nicknames. Do not paste (clipboard is unreliable)

## Inputs

- Vehicle nickname (e.g. BRONX-2) and/or eFleets id (e.g. 27BV73)
- The sheet row for that car (match column M eFleets id, not the nickname alone)

## Steps

1. On **eFleets All Cars sorted**, find the row. Click the Vehicle name in column B (the hyperlink to `https://login.efleets.com/fleetweb/vehicle/<id>`).
2. If Client Login appears, stop and have a human sign in on the box. Do not type a password.
3. If the vehicle page does not open from the link, go to the eFleets dashboard and use **Vehicle search**. Type the nickname (or the eFleets id). Click the matching result. Do not paste.
4. Open the **MILEAGE HISTORY** tab (not Fuel & Charging for this path).
5. Read the top / latest **FUEL** row: odometer and date. Mileage History dates are date-only. Do not invent midnight. Do not use OneStep’s odometer.
6. Copy the odometer by selecting it (or type it). Switch back to the sheet.
7. Write **G** = that fuel odometer and **H** = that fuel date on the same row. Leave E/F (last oil) alone unless oil is the question.
8. If the car is a pairing suspect, append `PAIR_SUSPECT` on K and do not treat the fuel odo as gospel.

## Demo (2026-08-17)

BRONX-2 / 27BV73 row 15: Mileage History FUEL 72,678 on 08/11/2026. Sheet G was 7,475 / H 7/24/2026 (stale). After the demo G was 72,678.
