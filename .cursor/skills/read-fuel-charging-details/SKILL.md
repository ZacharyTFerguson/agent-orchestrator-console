---
name: read-fuel-charging-details
description: >-
  Use when a last reading looks wrong or you need fill seconds: open Fuel &
  Charging DETAILS for one eFleets vehicle, search its id, read Provider
  Transaction Time, check Provider Company Vehicle Number for pairing, and
  download the DETAILS export.
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Read Fuel & Charging DETAILS

Use this when a car’s last reading looks stale or wrong, or when you need a full timestamp with seconds. Mileage History is date-only. Fuel & Charging DETAILS is the seconds source.

Stay signed in as zachary.ferguson.automations. Do not type passwords. Do not request inbox access.

## Inputs vs constants

**Inputs (change per car):**
- eFleets vehicle id (from the sheet name hyperlink or column M), e.g. `27BV73`
- Date range on DETAILS (`30 Days` is the usual first look; use `180 Days` when the latest clean fill is older)
- Which fill to trust (latest in-band odometer, not a backward or pairing-suspect punch)

**Fixed:**
- Company: PDI Services LLC `583424`
- Tab: **DETAILS** (not UTILIZATION)
- Search the **eFleets id**, not the nickname. Paste it. Do not type the nickname.
- Last Reading method stays: Enterprise odometer at that second + OneStep miles since that second. Never invent midnight from Mileage History. Never write G from a shop RO alone. Never use OneStep’s own odometer as G.

## Steps

1. On the Automations Copy workbook, tab **eFleets All Cars sorted**, find the vehicle name in column B. Hover the hyperlink and copy the eFleets id from the URL (`https://login.efleets.com/fleetweb/vehicle/<id>`). Open that vehicle page.
2. Optional: on **MILEAGE HISTORY**, note the latest FUEL odometer and its date. That date has no time of day. You can also copy the id from the **VEHICLE DETAILS \<id\>** header.
3. Top nav: **MY FLEET → FUEL & CHARGING → DETAILS**. Lands on `https://login.efleets.com/fleetweb/fuel?fuelTab=fuel` with DETAILS selected.
4. Leave the date-range dropdown on **30 Days** unless you need a longer window.
5. Paste the eFleets id into the table search box. Wait until the footer is `showing N of 1932 rows` (N is the filtered count).
6. Scroll right and read the latest clean row:
   - **Provider Transaction Date**
   - **Provider Transaction Time** (has seconds, e.g. `11:17:00 AM`)
   - **Provider Odometer** and **Provider Adjusted Odometer**
   - **Provider Unusual Odometer Flag**
7. Keep scrolling to **Provider Company Vehicle Number**. If it is a different nickname than this car (example: vehicle `27BV73` / BRONX-2 with company number `NYC-5`), treat the card as a pairing suspect. Do not auto-write G.
8. Green **DOWNLOAD → Excel** (not CSV, not PDF). File name: `DETAILS_583424_<range>.xlsx`. Row 1 is a title; headers are row 2.

## What the export columns mean

- `Vehicle` = eFleets id
- `Provider Transaction Date` + `Provider Transaction Time` = the known second
- `Provider Odometer` / `Provider Adjusted Odometer` = Enterprise odo at that second
- `Provider Company Vehicle Number` = what the WEX card thinks the unit is
- `Provider Driver First/Last Name`, site address, and posted date are supporting context, not G

A climb that later drops to a tiny odo (e.g. 72678 → 72356 → 72036 → 7475) is the pairing/stale-read pattern. Keep the in-band climb; flag the 7475-style leftovers.

## Writes

This skill is the lookup. It does not by itself write the sheet.

If you are correcting a last reading after a clean DETAILS packet:
- Write **G** = that Enterprise odo (+ OneStep miles since that second when doing the locked method)
- Write **H** = the transaction date (not the posted date, not a mistyped day)
- Never touch I/J
- Append a short note to **K** only (`PAIR_SUSPECT`, `NO_FILL_TIME`, etc.). Do not wipe existing K text.

On known pairing-suspect ids, skip G unless the band is proven.

## Do not

- Use Mileage History date-only as the timestamp
- Search the nickname in Fuel & Charging (paste the eFleets id)
- Trust a single fuel punch as gospel
- Drive Chrome via DevTools / Playwright when later running this skill (teach reconstruction only)
