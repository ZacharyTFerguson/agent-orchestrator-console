---
name: Sort fleet by unit prefix
description: >-
  Use when sorting PDI / eFleets vehicles into state sections (VA1 VA2 VA3…)
  with leftovers at the end.
---
# Sort fleet by unit prefix

Parse each nickname to `(region, number)`, then section and sort.

## Parse
1. Uppercase. Drop spaces, hyphens, underscores.
2. Longest prefix first: WESTCHESTER, BINGHAMTON/BING, BRONX, XRAY→RPI, WNY, NYC, RPI, else first two letters.
3. Next integer is the unit number. Remainder is a qualifier (color, US, year) and is not part of the key.
4. No number, blank, or `-` → leftover. Key leftovers named `-` by eFleets id.
5. Dictionary only for leftovers / specials: `DE 4 Jennifer Perez` → DE1. Do not alias `Office, was CT9` to CT9. `NJ OCEAN` and `NYC-SI1` stay leftover. `PK-2` is PK, not CT.

`VA1`, `VA 1`, `va1`, `Va1`, `va-1` all become `(VA, 1)`.

## Sort
1. Section by parsed prefix, not plate / License State.
2. Inside a section: 1, 2, 3… (natural), not lexical (`VA 2` before `VA 10`).
3. Tiebreak same nickname by eFleets id (`NJ8 New Ent.` is two cars).
4. OTHER leftovers last, alphabetical (`-` rows by eFleets id).

## Display
Keep the source nickname. Do not rewrite `VA1` to `VA 1` unless asked.
Region column = unit prefix, not plate state.

## Apply
Reorder the working **eFleets All Cars** tab only. Never edit the original PDI oil-change template or Oil Change Summary unless asked.
Preserve shop-corrected last-oil / last-reading (do not restore fuel Calculated Mileage).
After a Drive xlsx upload, re-apply date color rules in the live Sheet (custom-formula CF does not survive upload).
