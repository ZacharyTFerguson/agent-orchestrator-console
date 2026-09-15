---
name: read-efleets-mileage-history
description: >-
  Use when auditing a vehicle’s fuel vs shop odometers on eFleets Mileage
  History (how WEX punches become Calculated Mileage).
---

Migrated from GrokBot archive 2026-08-20. Original Grok agent IDs and /home/box paths preserved for reference.

# Read eFleets mileage history

Use this to see every fuel and shop odometer on one vehicle, and whether those punches look like a well-paired WEX card.

## Inputs
- eFleets id (`27SGXV`) or unit nickname (`VA1`). Type it. Do not paste (box clipboard is unreliable).

## Steps
1. Open `https://login.efleets.com/fleetweb/dashboard` for PDI Services LLC **583424** (keep Display Sub Customers Fleet checked). If Chrome is on the login page, the user signs in themselves. Never type or store a password.
2. In **Vehicle search**, type the eFleets id (demo: `27SGXV`) or the nickname (`va1`). Click the matching row. Confirm id, VIN, and nickname together (VA1 is `27SGXV`, 2022 Subaru Impreza).
3. On Vehicle Details, read the header: **Calculated Mileage** (fuel-driven, with as-of date) vs **Entered Mileage** (often stale). Calculated is the one eFleets treats as current. VA1 header was **134,794 as of 8/12/2026** vs entered 56,452 dated 3/1/2024.
4. Open the **MILEAGE HISTORY** tab. The table is newest-first. Columns that matter: Date, Odometer, Average Daily, **Odometer Source** (`FUEL` or `MAINTENANCE`), **Exception**, Driver.
5. A healthy card looks like VA1: fuel odometers climb about 60–110 miles/day, Exception says GOOD FUEL, and a same-day MAINTENANCE row sits on the same miles (VA1 shop oil **133,187** on 7/23–7/24/2026; fuel around it is 133,088 → 133,297 → 133,544). A yellow Exception such as BETTER is still in-family, not a 50k jump.
6. Optional: **MAINTENANCE** tab, Life-To-Date. Scroll right to the Odometer column. Oil/lube lines carry the shop odometer (VA1 Full Synthetic / Oil Filter at 133,187, RO **91199342**).
7. **DOWNLOAD** on Mileage History exports the punch list when you need several vehicles. Then return to Mileage History if you left it.

## How to read it
- Source `FUEL` is the WEX card pointer writing miles onto this unit.
- Source `MAINTENANCE` is the shop RO.
- Shop wins most of the time. Shop loses if later fuel is a tight climb on the old miles.
- Backward reads are junk. A wild jump: try a flipped digit before throwing the fill out. Expect about 500 miles/week.
- Header Calculated Mileage is usually the latest FUEL odometer. Do not copy it when it fights the last shop oil.

## Notes
- Search by eFleets id or nickname, not the driver tag (many units show driver `VA 10`).
- This is the vehicle-page table. Fuel & Charging is a different screen (search by eFleets id there too).
