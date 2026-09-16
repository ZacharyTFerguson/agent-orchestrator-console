# Suspected cards and possible homes — planning memo

**Local draft only. Do not email. Do not write to the live Google Sheet.**

Workbook: Automations Copy
Sheet id: `1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ`
Intended new tab name (exact): `Suspected cards and possible homes`

Draft files (this folder):

- `suspected-cards-plan.md` — this memo
- `suspected-cards-and-possible-homes.csv` — A–G table
- `suspected-cards-and-possible-homes.xlsx` — same table, one sheet, frozen header, column F wrapped, column G blank

As-of: 2026-08-19 (America/New_York). Live eFleets snapshot: `efleets-live-2026-08-19.csv`. Overdue snapshot: `overdue-today.txt`. Fuel DETAILS: `DETAILS_583424_30-Days-ALL-2026-08-18.xlsx` (primary, 2,026 txs) and `DETAILS_583424_30-Days-ALL.xlsx` (older, 1,932 txs). Mileage pairing workbook: `card-pairing-suspects.csv``/ `.xlsx`.

---

## 1. Purpose

Give the review team one tab that answers, for each messy unit:

- what vehicle we are looking at (A)
- what card / WEX pointer that unit’s **Fuel & Charging DETAILS** actually shows (B)
- where those punches probably belong (D) and which card should live there (E)
- why, with confidence and evidence type (C + F)

Column G is empty on purpose. Humans write there.

This is **not** an oil-due list. Overdue vs “reading looks wrong” stays on the sorted eFleets tab. Several pairing suspects are on the 8/19 overdue file as backward odometers (PA21, PA23, PA14 27SW52, WNY-9, WNY12) or as jump units (PA9). Those flags are why the tab is needed; they are not themselves proof of a card swap.

---

## 2. Locked columns

| Col | Header | Rule |
|---|---|---|
| A | Vehicle (current/off unit) | eFleets nickname + id + plate / year. Say when it is a second row (old PA14) or off-fuel. |
| B | Card currently assigned to A | **Provider Company Vehicle Number** + masked **Provider Card Number** + **Provider Vehicle Number**, as shown on that unit’s Fuel DETAILS. If the 30-day DETAILS file has no rows for that eFleets id, write **UNKNOWN** and why. Do not invent a card number. Mileage History has no card #. |
| C | Argument / readability spacer | Short dispute / confidence / “leave the other card alone.” Or blank. |
| D | Candidate home vehicle | Where the punches probably belong. |
| E | Card that should go with D | The card that should move (or stay). |
| F | Why that card can live on D | Mileage cross-hit, same-day, region, shop vs FUEL band. Mark confidence. Say DETAILS vs mileage-only. |
| G | Review notes | **Leave empty.** |

Freeze the header. Wrap F. One sheet, name exact.

---

## 3. Cycle

1. Morning overdue pass uses the live sorted tab + `overdue-today.txt`. Jump units (NJ9, NJ17, NYC4, PA9, WNY5) stay in “readings that look wrong,” not due.
2. Pairing pass uses Fuel DETAILS, not Mileage History, when we need a card / company-vehicle-number. Mileage History can only show shop-vs-FUEL fights and odometer cross-hits.
3. This draft is the pairing pass. Nothing is written to Automations Copy until Zachary says the tab is ready.
4. After a card is actually moved in WEX / eFleets, pull a fresh DETAILS and re-check that PCVN now matches the home unit, then the review team can mark G.

---

## 4. What is proven vs suspect

**Pairing evidence = Provider Company Vehicle Number on Fuel & Charging DETAILS.** Not Mileage History.

### DETAILS columns we found (both 30-day files)

Present on sheet `DETAILS_583424`, header row 2, inline strings: Master Cust Num, Vehicle (eFleets id), Program Provider, Provider Transaction Date/Time, Provider Account Number, **Provider Vehicle Number**, **Provider Card Number** (masked `xxxxxxxxxxxxx` + last 5), Provider Driver names, Provider Vehicle Description, Year/Make/Model/VIN, **Provider Company Vehicle Number**, location/city/state, **Provider Odometer**, unusual flag, adjusted odo, gallons / dollars / MPG / fuel type.

Nothing we needed was missing. Openpyxl’s `dimension` is stuck at A1 (inline-string export), so the files have to be read from worksheet XML, not from a naive openpyxl used-range.

### Proven DETAILS vehicle-number hits (card labeled X posts onto unit Y)

1. **PA21 card → PA9 (285JCH).** 30 punches, PCVN `PA21`, WEX …31757, odo 123,010–129,557, western PA (Lower Burrell / New Kensington / Pittsburgh). PA21’s own id `285JCR` has **zero** 30-day DETAILS rows. Shop side: PA21 oil 122,355 (7/14 Wexford) and 129,622 (8/17 Butler, in the 8/18 maint file, not yet on the live tracker). Same-day 7/29-class tightness on the 8/13–8/17 129k pair (gap 65). This is the only jump-unit on the overdue list that we may treat as a proven swap, because it has a PCVN hit.
2. **PA23 card → PA24 (285JCN).** 7 punches, PCVN `PA23`, WEX …31781, odo 63,509–65,168. Same-day 7/29: 64,620 (Lebanon) vs PA23 shop 64,639 (Lititz), gap 19. Extra vs the original mileage-suspects list (that list called PA23 dirty FUEL, no named home). PA23’s own id `285JCP` has zero 30-day DETAILS rows. PA24 also has its own correct card …32490 at 49–51k — leave that one.

### Mileage-only suspects (PCVN matches the host nickname, odometer does not)

3. **CT2 ↔ CT3.** Reciprocal. CT2 DETAILS card is still labeled CT2 (…31229) but odo is 194k (CT3 shop 194,409, gap 236). CT3 DETAILS card is still labeled CT3 (…32581) but odo is 147–149k (CT2 shop 148,859, gap 16). Word as suspect. Live tracker last-readings (CT2 149,899 on 8/17, CT3 194,913 on 8/16) already sit on the shop bands; FUEL DETAILS still fights.
4. **WNY-9 → WNY12.** WNY-9 DETAILS card is still labeled WNY9 (…31864) but odo is 119–122k. WNY12 shop 118,418 (7/9 Tonawanda) vs WNY-9 post-drop FUEL 118,554 (7/13), gap 136, same region. WNY12 has **no DETAILS rows**. Not a PCVN hit.

### DETAILS named the card, but the home is this same unit (dirty punch / leftover nickname)

5. **BRONX-2.** Card is PCVN `NYC-5` / WEX …31252 (no live NYC-5). 7,475 is stuck junk; 72,036–72,678 matches shop 68,107 + ~500 mi/week. Not a clean other-unit cross-hit.

### DETAILS named the card; second band on the same card; no second live home

6. **Old PA14 27SW52.** Card is PCVN `PA10` / WEX …31880 (no live PA10). 122k Philly punches match this Rogue’s shop 121,589 (West Chester). 30–32k cluster is the other band (fleet calc 32,037). New PA14 29FXD7 is **not** the home — it already has PCVN PA14 / WEX …31906 at 38–41k. Weak 32k↔35k gap (3,368) stays discarded.

### UNKNOWN card on the unit’s own DETAILS (card is posting elsewhere)

7. **PA21 (285JCR)** — UNKNOWN on its own DETAILS; PA21-labeled card is on PA9.
8. **PA23 (285JCP)** — UNKNOWN on its own DETAILS; PA23-labeled card is on PA24.
9. **WNY12 (27F34S)** — UNKNOWN; no punches under label WNY12 either.

---

## 5. Jump units — not proven swaps

From `overdue-today.txt` “readings that look wrong.” DETAILS (8/18) shows **their own** PCVN on their own eFleets id. Do **not** treat as proven swaps:

| Unit | eFleets | Last oil vs last reading | DETAILS card | Notes |
|---|---|---|---|---|
| NJ9 | 29FXDP | 18,431 (4/3) vs 151,298 (8/12) | PCVN NJ9 / WEX …31088, 5 punches odo 25,388–151,298 | Own card, wild odo. No other-unit PCVN. |
| NJ17 | 292NFV | 16,825 (7/8) vs 84,109 (8/17) | PCVN NJ17 / WEX …30999, 7 punches odo 18,358–82,085 | Own card. No other-unit PCVN. |
| NYC4 | 285JCC | 20,493 vs 55,516 | PCVN NYC-4 / WEX …69390, 4 punches odo 27,000–54,455 | Own card (nickname hyphen only). |
| WNY5 | 26KGFV | 157,932 (10/21/25) vs 190,836 (8/10) | PCVN WNY5 / WEX …32235, 10 punches 187,014–191,191 | Own card, one climb. Already reviewed as not a pairing suspect (~780 mi/week, heavy but one band). |
| PA9 | 285JCH | 23,464 vs 129,143 | **Exception — see proven hit above** | Own PA9 card at 41–42k **and** PA21 card at 123–129k. |

---

## 6. Seen in DETAILS and not listed as swaps

These look like **stale WEX nicknames on the correct car** (odo matches the host shop), or formatting (Ohio-1 vs OH1, NYC-8 vs NYC-8-US, WESTCHESTER3 vs Westchester 3 -US), or unmapped leftover names (RPI25 on VA12, PA26 on WNY13). Punches already live on the host. Not invented as homes:

- WNY13 card …98537 posts onto BK7 at 51–54k (matches BK7 48,516 / 54,842). WNY13’s own DETAILS is PCVN PA26 / …76848 at 68–70k in Reading PA (matches WNY13 shop 68,041). Nickname leftovers, odo agrees with host.
- VA2 card …08481 posts onto VA 31 at 8–12k (matches VA 31 shop 10,054 / read 12,949). VA 2 itself has an RPI30 leftover card at 144–147k matching VA 2’s 147,367 shop.
- VA25 → MD27 (99–102k matches MD27 shop 101,362), MD23 → MD32 (27–30k matches MD32 22,735 / 29,891), PK2 vs PK-2 (two different live units that share a collapsed nickname), two PA15 ids (29FXD9 and 292NCX).
- NJ1 (27CKN3): PCVN NJ1 / WEX …32672, junk odo 8,867–877,866. Own shop and the surviving 79–87k band agree. Messy punches, not a wrong-unit pair. Left off the table on purpose (original list: low / not a swap).

Do not promote these to homes without a shop-vs-FUEL fight **and** a tight same-region cross-hit, or a PCVN whose odo matches the *other* unit’s shop.

---

## 7. Login note (placeholder)

Enterprise / eFleets / WEX login used to pull Fuel DETAILS:

> **[ask Zachary — not stored in this draft]**
> Last successful DETAILS pull on this box: 30-day ALL dated 2026-08-18, customer 583424, program “WEX Enterprise ExxonMobil Card.”
> Account number in the export is masked (`xxxxxxxxx0593`). Card numbers are masked (`xxxxxxxxxxxxx` + last 5).

Do not put a password, cookie, or session token in this folder or on the tab.

---

## 8. Next research questions

1. Pull Fuel DETAILS on **285JCR (PA21)**, **285JCP (PA23)**, and **27F34S (WNY12)** with a wider date window (90–180 days). Confirm they truly have no recent txs vs the pointer posting elsewhere.
2. After any WEX move: confirm PA21’s DETAILS starts showing …31757, PA23’s starts showing …31781, and PA9/PA24 only keep their own cards.
3. CT2/CT3: PCVN still matches the host names. Is the physical card in the other glovebox, or is only the odometer typed wrong? Need a driver check (Jake Morello appears on both CT2’s 8/10 wild punch and a CT3 7/20 fill).
4. WNY-9 151k shop vs 122k FUEL: did the pointer flip mid-July (one card, t{� cars) or did Gary Ellwood start driving WNY12’s car with the WNY9 card? WNY12 DETAILS is the missing piece.
5. Old PA14 / PA10: who was PA10? Is …31880 a retired nickname on the Rogue, and should the 32k punches be suppressed rather than moved?
6. BRONX-2: rename PCVN NYC-5 → BRONX-2 on card …31252, and suppress 7,475 so Fleet Calculated Mileage stops winning on the stuck punch (tracker last-reading is already 72,678).
7. Live tracker oil dates: PA21 still shows 122,355 (7/14) while maint 8/18 has 129,622 (8/17 Butler). Refresh the tracker from Maintenance before anyone treats 42,806 as current.
8. Do not invent homes for NJ9 / NJ17 / NYC4 / WNY5 without a PCVN that names a different live unit.

---

## 9. Row inventory (this draft)

10 data rows + header.

| # | A unit | Evidence | Confidence |
|---|---|---|---|
| 1 | CT2 | mileage-only (PCVN still CT2; odo is CT3 band) | high |
| 2 | CT3 | mileage-only (PCVN still CT3; odo is CT2 band) | high |
| 3 | PA9 | **DETAILS PCVN PA21** on 285JCH | high |
| 4 | PA21 | UNKNOWN on own DETAILS; other-side PCVN + shop | high |
| 5 | PA14 27SW52 | DETAILS card identity PA10; 122k = this Rogue | med |
| 6 | WNY-9 | mileage-only (PCVN still WNY9; odo is WNY12 band) | high |
| 7 | WNY12 | UNKNOWN; receiving end of #6 | high |
| 8 | BRONX-2 | DETAILS card identity NYC-5; dirty 7,475; 72k stays | med |
| 9 | PA24 | **DETAILS PCVN PA23** on 285JCN (extra) | high |
| 10 | PA23 | UNKNOWN on own DETAILS; other-side PCVN | high |

Pairs with a **real card / company-vehicle-number from DETAILS**: PA9/PA21 (…31757), PA24/PA23 (…31781), plus card identities on CT2 (…31229), CT3 (…32581), WNY-9 (…31864), BRONX-2 (…31252), old PA14 (…31880), and PA9’s own keep-card (…31203) / PA24’s own keep-card (…32490).

Pairs that are **mileage-only suspects** (no PCVN mismatch): CT2↔CT3, WNY-9→WNY12.

Units with **UNKNOWN** B because DETAILS had no rows: PA21, PA23, WNY12.

VA1 (27SGXV) remains the clean control (PCVN VA1 / WEX …31070, odo 132,667–134,794 matches shop 133,187). Not a row on this tab.
