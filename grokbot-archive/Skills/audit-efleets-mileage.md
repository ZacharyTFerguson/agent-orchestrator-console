---
name: Audit eFleets mileage
description: >-
  Use when checking a vehicle’s last oil or last reading in eFleets because
  fuel-card odometers, pre-auths, or fat-finger entries may be wrong.
---
# Audit eFleets mileage

Assume eFleets is already signed in. Do not type passwords.

**Inputs:** unit name (e.g. CT2), eFleets vehicle id (e.g. 26ZMJT), or plate.

Fuel-card odometers, wrong-card swipes, pre-authorizations, and fat-finger entries are common. Do not copy Calculated Mileage or a FUEL odometer onto the oil-change sheet until it survives this check.

## 1. Open the vehicle
- On **eFleets All Cars**, click the unit name (column B). That is a link to `https://login.efleets.com/fleetweb/vehicle/{id}`.
- If login appears, the user signs in. After login, click the same link again so it lands on the vehicle, not just the dashboard.
- Copy the eFleets id from the sheet (column M) when you need it for search.

On Vehicle Details, note header **Calculated Mileage** and its date. That number is often a FUEL reading and is what a naive export uses as Last Reading.

## 2. Mileage History, then Maintenance
Open **Mileage History**. For recent rows read Odometer, **Odometer Source** (`FUEL` vs `MAINTENANCE`), and **Exception Reason** (`READING ABOVE…` / `READING OUT…` = discard).

Then open **Maintenance** and expand the latest oil RO. The shop odometer on that visit is the true miles at service (oil + filters, etc.). A FUEL row tens of thousands of miles away from that shop number is not real mileage.

## 3. Fuel & Charging
**MY FLEET → Fuel & Charging**, or `https://login.efleets.com/fleetweb/fuel?fuelTab=fuel`.

- Range: **30 Days** (widen if needed)
- Search the eFleets vehicle id (not the unit nickname)
- Match posted dates to Mileage History FUEL rows
- Read **Provider Odometer**, **Unusual Odometer Flag**, gallons, merchant, and the name on the card
- Flag **Y** = eFleets already thinks the odometer is bad. Flag **N** is not enough to trust it if the number still fights the last shop odometer
- Wrong driver / wrong card = do not use that odometer

## 4. Last oil
On **Maintenance**, range **Life-To-Date**. Last oil = latest oil service (`Full Synthetic Lube Oil Filter` or the other oil-change descriptions), **RO Completed Date** + that line’s **Odometer**.

## 5. What to write on the sheet
- **Last Oil Change** = the maintenance oil odometer and date
- **Last Reading** = only a mileage row in the same ballpark as that oil. If Calculated Mileage conflicts with last oil, do not copy it. Flag the row
- A huge leftover or huge negative in **Change oil at 0** means last reading and last oil came from incompatible sources. Fix the reading, not the 5k formula

Do not edit the original PDI template. On the Automations file, change **eFleets All Cars** unless asked to touch Oil Change Summary.
