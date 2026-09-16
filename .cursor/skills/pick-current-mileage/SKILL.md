---
name: pick-current-mileage
description: >-
  Use when choosing a vehicle’s current odometer from messy eFleets fuel punches
  (backward reads, fat fingers, flipped digits).
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Pick current mileage

Fuel punches lie. Do not take the latest odometer. Run `/workspace/vehicle_mileage.py` (`pick_current_mileage`).

## Rules
1. Sort by date. If dates are missing but in order, treat each punch as one week after the last kept one.
2. Drivers run about **500 miles a week** (override if the user says otherwise).
3. Odometers do not drop. A backward read is junk.
4. A punch may add at least one weck of driving (one tank), even on a 1-day gap. A jump many times that is wild.
5. For a wild jump, try adjacent digit swaps, then one-digit edits. If a repair lands in the expected band, that repaired value is current and must be flagged (`130000` → `103000`).
6. A shop / maintenance RO odometer beats fuel when they fight.

## Report
Current miles, as-of date, any repair, and discarded punches. Do not silently rewrite the sheet.
