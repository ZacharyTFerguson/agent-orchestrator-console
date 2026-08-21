---
name: pull-miles-since-oil-shop
description: >-
  Use when composing Last Reading after a shop oil change: find the OneStep
  stop at the oil shop, take that real second, then pull GPS distance since
  that time. Do not invent midnight from a date-only RO.
---

# Pull miles since the oil-shop stop

Last Reading is **Enterprise shop odometer at a known second + OneStep distance since that second**. The known second is when the tracker was at the oil shop, not 00:00:00 on the RO date.

OneStep’s own odometer / Calculated Mileage is never Last Reading. Do not write the sheet unless asked. Never write columns **I/J**. Never dump VIN, plate, or `device_id` into git.

## Inputs

- Unit nickname (sheet column B), e.g. `VA15` / OneStep `VA-15`
- Last oil odometer and date from the working sheet (columns E/F)
- Optional later bound: **end of that day ET** (default for the oil-day compose) or **now / end of today ET** (miles since the visit)

Fixed:

- Working sheet: Automations Copy `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ`, tab **eFleets All Cars sorted**
- Timezone: **America/New_York**
- Client: `server/src/clients/onestep.js` (`driveStopMiles`, `extractDistance`, `composeLastReading`)
- Auth: Cloud secrets `OneStepAPIKEY` / `OneStepAPIKEYTobeSigned` (JWT). Portal user/password is optional; drive-stop works with the API JWT when params are complete.

## Steps

1. **Last good odo.** Read E/F (last oil). Shop / maintenance beats a fighting fuel punch. That odometer is the Enterprise value at the shop visit. Mileage History is date-only — do not invent midnight from it.

2. **Device id.** `GET /v3/api/public/device?limit=300`. Match `display_name` prefix (`VA-15:`). `device-info` is names only. Do not paste `device_id` into chat or git.

3. **Oil-day History.** `GET /v3/api/public/route/drive-stop` with all of:
   - `device_id`
   - `dt_tracker_from` = oil date `00:00:00` ET (search window only)
   - `dt_tracker_to` = oil date `23:59:59` ET
   - `stop_duration` = `5m0s`
   - `include_incomplete_drive_stops` = `true`
   - `force_start_time` = `true`

   Missing those params **403**. Distance is `{ value, unit: "mi", display }`. `extractDistance` reads `value` and rejects odometer fields.

4. **Find the shop stop.** Use `drive_stop_list` items with `type=stop`. Reverse-geocode `lat_lng_best_first` (Nominatim is fine). Pick the stop that is an oil shop (Jiffy Lube, Valvoline, Take 5, Firestone, dealer lube, etc.). Prefer a **20+ minute** daytime stop. Overnight house/apartment stops are not the shop.

   If none match, stop. Do not guess. Get the vendor address from eFleets Maintenance (human Chrome login) or Fuel & Charging seconds and retry the match.

5. **T = the shop clock time.** Use **leave** (`time_to`) as the known second. If the stop’s own distance is `0 mi`, arrive (`time_from`) and leave yield the same miles — still report both. Convert Z to ET when reporting.

6. **Miles since T.** Call drive-stop again:
   - `dt_tracker_from` = T (ISO)
   - `dt_tracker_to` = end of oil day ET, and/or now / end of today ET if that is the question
   - same `stop_duration` / flags as step 3

   Read `extractDistance` → `miles`. Do not sum child odometers. Do not treat a 403 as miles.

7. **Compose (do not auto-write).** `composeLastReading({ enterpriseOdo: lastOil, oneStepMiles })` → `MD40_METHOD`. Round for humans (one decimal on miles; whole miles on Last Reading unless asked). Leave G/H alone unless the user asked to write Last Reading.

## Report

- Shop name and address
- Arrive and leave (ET and UTC)
- Stop duration
- Miles since T for each requested bound, with `time_from` / `time_to` from the API
- Composed Last Reading, and whether the sheet was written (default: no)
- That pre-shop miles on the oil date were excluded (midnight→T is not added to the shop odo)

## Demo (VA-15, 2026-08-21)

Sheet: `VA15` last oil **96,384** on **8/17/2026**. Last Reading on the sheet was **94,923** / 8/6 (stale; not written).

Oil-day stops: the 1h 11m stop reverse-geocoded to **Jiffy Lube, 5710 W Broad St, Richmond/Henrico VA 23230**.

- Arrive `2026-08-17T17:45:53Z` (1:45:53 PM ET)
- Leave `2026-08-17T18:56:45Z` (2:56:45 PM ET)
- Stop distance 0 mi, so arrive and leave miles matched

Drive-stop since that time:

| Bound | Miles | Compose (not written) |
|---|---|---|
| Leave → 8/17 23:59 ET | 8.951 (display 9 mi) | 96,393 |
| Leave → 8/21 ~5:57 PM ET | 625.286 (display 625.3 mi) | 97,009 |

Midnight-on-8/17 through 8/21 was 746.9 mi. The extra ~122 mi is driving **before** Jiffy Lube and must not be added to 96,384.

## Do not

- Invent `00:00:00` as T from a date-only oil or fuel punch
- Use OneStep odometer / Calculated Mileage as Last Reading
- Treat drive-stop **403** (missing params) or **500** as miles
- Write columns I/J or the original PDI template
- Paste API keys, PEMs, JWTs, portal passwords, VIN, plate, or `device_id`
- Blast several OneStep report RUNs if you fall back to Chrome Total Distance
