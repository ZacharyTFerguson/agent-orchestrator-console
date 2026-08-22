---
name: fix-fat-finger-oil
description: >-
  Use when Maintenance last-oil fights a tight fuel cluster on the same
  vehicle's own card. If at least three fuels are consistent, reconstruct
  last oil as last good fuel minus OneStep miles from the oil-shop second
  to the fuel second.
---

# Fix a fat-finger last-oil odometer

Shop / Maintenance usually beats a fighting fuel punch. **Exception:** the fuel card that belongs to this car recorded mileages consistently, carefully, and precisely **at least three times**. Then the oil RO odometer is the error. Assume those fuels are correct.

`corrected_last_oil = last_good_fuel_odo − OneStep_distance(T_oil → T_fuel)`

That is the inverse of `composeLastReading` (`FAT_FINGER_OIL` in `reconstructLastOil`). T_oil is the History **leave** time at the oil shop, not invented midnight. T_fuel is the Provider Transaction Date **and** Time (or the GPS stop at that fuel station). Date-only sheet G/H is not T_fuel.

## Gate

1. Confirm the fuels are on **this unit's own card** (not a swapped PCVN). See `.cursor/skills/remap-swapped-fuel-cards/SKILL.md`.
2. Need **≥3** Unusual=N punches, spread ≤ 4,000 mi, climbing with time (~500 mi/week is in-band).
3. Maintenance / sheet last oil sits off that band (classic: one digit, e.g. 272k vs 278k).
4. Do not use OneStep odometer. Distance only, `extractDistance`.

## Writes (only when asked)

Working sheet **eFleets All Cars sorted**: column **E** (keep **F** unless the RO date is also wrong). **G** stays the last good fuel. **K** gets `FAT_FINGER_OIL`. Never **I/J**. Never the original PDI template.

Due-at is `corrected_last_oil + 5000` (formula in J; do not write J).

## Demo gate (VA10)

Working sheet last oil **272,375** on **7/27/2026** vs dated-copy Maintenance **278,374** the same day. Last reading **275,879** on **8/17**. Do **not** promote 278,374. Reconstruct only after three in-band fuels and a real T_oil / T_fuel; until then leave 272,375 and skip the Maintenance odo.

## Do not

- Invent `00:00:00` as T from a date-only oil or fuel punch
- Fat-finger-correct from a single fuel
- Apply this to a swapped card's punches
- Paste VIN, plate, `device_id`, keys, or PEMs
