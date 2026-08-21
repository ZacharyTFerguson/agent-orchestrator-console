---
name: remap-swapped-fuel-cards
description: >-
  Use when Fuel DETAILS shows another unit's card punching onto a host, or
  when a naive eFleets CSV apply wrote those miles onto the wrong row. Remap
  Last Reading to the home vehicle. Do not invent card numbers.
---

# Remap swapped fuel cards

A **host** is the eFleets unit the punches currently post onto. A **home** is the vehicle those punches belong to (Provider Company Vehicle Number on Fuel DETAILS, confirmed by a tight shop-vs-fuel band and/or OneStep: host parked while home drove).

Pinned homes: `config/oil-card-homes.json`. Last 5 of the card only. No VIN, plate, or full card number.

## Proven (write the working sorted tab)

| Card last 5 | Currently on (host) | Home | Host keeps |
|---|---|---|---|
| `31757` | PA9 `285JCH` | PA21 `285JCR` | PA9's own `31203` |
| `31781` | PA24 `285JCN` | PA23 `285JCP` | PA24's own `32490` |

Do **not** treat CT2↔CT3 or WNY-9→WNY12 as proven moves: PCVN still matches the host nickname; odometer is the suspect. OneStep 8/17 and 8/7: CT2 drove while CT3 parked. OneStep 8/17 and 8/6: WNY-9 parked (GPS alive) while WNY12 drove — PA24-style GPS but WEX still says WNY9, so suspect only.

Do **not** send card `31104` (PCVN MD23, posts on MD32) to MD23: miles match MD32; OneStep 8/16 MD32 drove / MD23 parked.

## Sheet writes (working Automations Copy)

Tab **eFleets All Cars sorted** only. Never original template. Never columns **I/J**.

1. Last oil on the **home** comes from Maintenance on that eFleets id (not a shared nickname like two PA14s).
2. Last reading on the **home** is the latest Unusual=N punch from the swapped card, or shop odo + OneStep miles since the shop leave.
3. Last reading on the **host** must not keep the swapped band. If the host's own card has an in-band punch, use that. Else compose from the host's own last oil + OneStep. Do not leave a 100k jump on the host.
4. Notes (K): `CARD_HOME` / `CARD_SWAP host`. Review notes on **Suspected cards and possible homes** (that tab's column I is review text, not the sorted-tab formulas).
5. Moving the physical WEX card still needs a human in eFleets. The sheet remap is the miles; it is not the glovebox move.

## Updater

`npm run oil-sheet-update` loads `config/oil-card-homes.json` and remaps in-band host fuel onto the home before proposing G/H. Shared nicknames do not copy one oil RO onto both rows.

## Do not

- Promote NJ9 / NJ17 / NYC4 / WNY5 jumps as card swaps (PCVN is their own name)
- Copy Maintenance oil by unit nickname when two rows share that name
- Invent midnight as T
- Write I/J on the sorted tab or the original PDI template
