/**
 * Remap swapped fuel-card punches onto the vehicle they belong to.
 *
 * Fuel DETAILS can show Provider Company Vehicle Number (PCVN) X posting
 * onto eFleets unit Y. The oil-sheet updater otherwise writes that odometer
 * onto Y. This module moves in-band punches to X's row and leaves Y's own
 * card alone.
 *
 * Shared nicknames (two PA14 rows) must not share one Maintenance RO.
 * Never dump VIN, plate, or full card numbers.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFleetKey } from "./efleets-exports.js";
import { reconstructLastOil as reconstructLastOilFromMiles } from "./clients/onestep.js";

const DEFAULT_HOMES_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../config/oil-card-homes.json"
);

export const CARD_HOME_BAND_MILES = 8_000;
export const FAT_FINGER_MIN_FUELS = 3;
export const FAT_FINGER_MAX_SPREAD_MILES = 4_000;

export function loadCardHomes(path = DEFAULT_HOMES_PATH) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return (raw.homes || []).map((h) => ({
    ...h,
    hostEfleetsId: normalizeFleetKey(h.hostEfleetsId),
    homeEfleetsId: normalizeFleetKey(h.homeEfleetsId),
    hostUnit: normalizeFleetKey(h.hostUnit),
    homeUnit: normalizeFleetKey(h.homeUnit),
  }));
}

export function uniqueUnitKeys(sheetRows) {
  const counts = new Map();
  for (const row of sheetRows) {
    if (!row.unitKey) continue;
    counts.set(row.unitKey, (counts.get(row.unitKey) || 0) + 1);
  }
  const unique = new Set();
  for (const [key, n] of counts) {
    if (n === 1) unique.add(key);
  }
  return unique;
}

export function fuelOdoCloserToHome(odometer, homeOil, hostOil) {
  if (odometer == null || homeOil == null) return false;
  const dHome = Math.abs(odometer - homeOil);
  const dHost = hostOil == null ? Number.POSITIVE_INFINITY : Math.abs(odometer - hostOil);
  return dHome < dHost && dHome <= CARD_HOME_BAND_MILES;
}

export function remapFuelByCardHome(fuel, sheetRows, homes = []) {
  if (!fuel) return fuel;
  const latestClean = new Map(fuel.latestClean);
  const latestAny = new Map(fuel.latestAny);
  const byId = new Map(sheetRows.map((row) => [row.eFleetsId, row]));

  for (const home of homes) {
    const hostFuel = latestClean.get(home.hostEfleetsId);
    if (!hostFuel) continue;
    const hostRow = byId.get(home.hostEfleetsId);
    const homeRow = byId.get(home.homeEfleetsId);
    if (
      !fuelOdoCloserToHome(hostFuel.odometer, homeRow?.lastOil, hostRow?.lastOil)
    ) {
      continue;
    }
    const existing = latestClean.get(home.homeEfleetsId);
    if (!existing || hostFuel.at > existing.at) {
      latestClean.set(home.homeEfleetsId, {
        ...hostFuel,
        eFleetsId: home.homeEfleetsId,
        remappedFrom: home.hostEfleetsId,
        cardLast5: home.cardLast5,
      });
    }
    latestClean.delete(home.hostEfleetsId);
  }

  return { ...fuel, latestClean, latestAny };
}

export { reconstructLastOilFromMiles as reconstructLastOil };

export function fuelsAreConsistent(readings, { min = FAT_FINGER_MIN_FUELS, maxSpread = FAT_FINGER_MAX_SPREAD_MILES } = {}) {
  const odos = (readings || [])
    .map((r) => Number(r.odometer ?? r.odo))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (odos.length < min) return { ok: false, reason: "NEED_THREE_FUELS", count: odos.length };
  const spread = odos[odos.length - 1] - odos[0];
  if (spread > maxSpread) return { ok: false, reason: "FUEL_SPREAD", spread, count: odos.length };
  return { ok: true, count: odos.length, spread, low: odos[0], high: odos[odos.length - 1] };
}
