/**
 * Propose guarded writes for Automations Copy → eFleets All Cars sorted.
 *
 * Writes only E/F (last oil + date) and G/H (last reading + date).
 * Never writes I/J. Never targets the original PDI template.
 * Last Reading is Enterprise fuel odometer at a known second, never Calculated Mileage.
 * OneStep miles-since is HOLD — not added here.
 */
import {
  JUMP_SUSPECT_MILES,
  ORIGINAL_TEMPLATE_ID,
  WORKING_SHEET_ID,
  parseCsv,
  parseMiles,
} from "./oil-changes.js";
import { formatUsDate, normalizeFleetKey, parseUsDate } from "./efleets-exports.js";
import { assertWritableOilRange } from "./clients/sheets.js";

export const UPDATE_TAB = "eFleets All Cars sorted";

function headerMap(row) {
  const map = {};
  row.forEach((h, i) => {
    map[String(h ?? "").trim().toLowerCase()] = i;
  });
  return map;
}

function cell(row, idx) {
  if (idx == null) return "";
  return String(row[idx] ?? "").trim();
}

export function parseSheetVehicleRows(csvText) {
  const rows = parseCsv(csvText);
  let headerIndex = -1;
  let map = {};
  for (let i = 0; i < rows.length; i += 1) {
    map = headerMap(rows[i]);
    const hasLastOil = map["last oil change completed"] != null || map["last oil"] != null;
    if (map.vehicle != null && hasLastOil && map["last reading"] != null) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) throw new Error("Could not find eFleets All Cars header row");

  const headerRow = rows[headerIndex];
  const lastOilIdx = map["last oil change completed"] ?? map["last oil"];
  const dateCols = [];
  headerRow.forEach((h, i) => {
    if (String(h ?? "").trim().toLowerCase() === "date") dateCols.push(i);
  });
  const oilDateIdx = dateCols[0];
  const readingDateIdx = dateCols[1] ?? dateCols[0];

  const vehicles = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const vehicle = cell(row, map.vehicle);
    if (!vehicle || vehicle.toLowerCase() === "vehicle") continue;
    const eFleetsId = normalizeFleetKey(cell(row, map["efleets id"]));
    const region = cell(row, map.region);
    const isSpacer = region && !eFleetsId && vehicle === region;
    if (isSpacer) continue;

    vehicles.push({
      sheetRow: i + 1,
      vehicle,
      unitKey: normalizeFleetKey(vehicle),
      eFleetsId,
      lastOil: parseMiles(cell(row, lastOilIdx)),
      lastOilDate: parseUsDate(cell(row, oilDateIdx)),
      lastReading: parseMiles(cell(row, map["last reading"])),
      lastReadingDate: parseUsDate(cell(row, readingDateIdx)),
    });
  }
  return { headerIndex, vehicles };
}

export function parsePatchA1(range) {
  const m = String(range).match(/!([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
  if (!m) throw new Error(`Bad A1 range: ${range}`);
  return {
    startCol: m[1].toUpperCase(),
    startRow: Number(m[2]),
    endCol: m[3].toUpperCase(),
    endRow: Number(m[4]),
  };
}

export function applyPatchesToVehicleRows(vehicles, patches) {
  const byRow = new Map(patches.map((p) => [p.sheetRow, p]));
  return vehicles.map((row) => {
    const patch = byRow.get(row.sheetRow);
    if (!patch) return { ...row };
    const cols = parsePatchA1(patch.range);
    const vals = patch.values[0] || [];
    const next = { ...row };
    if (cols.startCol === "E" && cols.endCol === "H") {
      next.lastOil = Number(vals[0]);
      next.lastOilDate = parseUsDate(vals[1]);
      next.lastReading = Number(vals[2]);
      next.lastReadingDate = parseUsDate(vals[3]);
    } else if (cols.startCol === "E") {
      next.lastOil = Number(vals[0]);
      next.lastOilDate = parseUsDate(vals[1]);
    } else if (cols.startCol === "G") {
      next.lastReading = Number(vals[0]);
      next.lastReadingDate = parseUsDate(vals[1]);
    }
    return next;
  });
}

export function chunkPatches(patches, size = 40) {
  const n = Math.max(1, Number(size) || 40);
  const chunks = [];
  for (let i = 0; i < patches.length; i += n) chunks.push(patches.slice(i, i + n));
  return chunks;
}

export function toSheetValueRanges(patches) {
  return patches.map((p) => ({
    range: p.range,
    values: p.values,
    majorDimension: "ROWS",
  }));
}

function lookupOil(row, oil, ids) {
  if (row.eFleetsId && oil.latestByEfleets.has(row.eFleetsId)) {
    return oil.latestByEfleets.get(row.eFleetsId);
  }
  if (row.unitKey && oil.latestByUnit.has(row.unitKey)) {
    return oil.latestByUnit.get(row.unitKey);
  }
  if (ids?.byUnit.has(row.unitKey)) {
    const mapped = ids.byUnit.get(row.unitKey);
    if (mapped?.eFleetsId && oil.latestByEfleets.has(mapped.eFleetsId)) {
      return oil.latestByEfleets.get(mapped.eFleetsId);
    }
  }
  return null;
}

function lookupFuel(row, fuel, ids) {
  const tryId = (id) => (id && fuel.latestClean.has(id) ? fuel.latestClean.get(id) : null);
  return (
    tryId(row.eFleetsId) ||
    tryId(ids?.byUnit.get(row.unitKey)?.eFleetsId) ||
    null
  );
}

function shouldWriteOil(row, oilRec) {
  if (!oilRec) return false;
  if (row.lastOil == null) return true;
  if (row.lastOilDate && oilRec.completed < row.lastOilDate) return false;
  if (row.lastOilDate && oilRec.completed.getTime() === row.lastOilDate.getTime() && oilRec.odometer === row.lastOil) {
    return false;
  }
  if (row.lastOilDate && oilRec.completed.getTime() === row.lastOilDate.getTime() && oilRec.odometer !== row.lastOil) {
    return true;
  }
  if (!row.lastOilDate) return oilRec.odometer !== row.lastOil;
  return oilRec.completed > row.lastOilDate;
}

function shouldWriteReading(row, fuelRec, nextOil) {
  if (!fuelRec) return false;
  const lastOil = nextOil ?? row.lastOil;
  if (lastOil != null && fuelRec.odometer < lastOil) {
    return { ok: false, skip: "backward" };
  }
  if (row.lastReading != null && fuelRec.odometer < row.lastReading) {
    return { ok: false, skip: "older-reading" };
  }
  if (row.lastReading != null && fuelRec.odometer - row.lastReading > JUMP_SUSPECT_MILES) {
    return { ok: false, skip: "suspect-jump" };
  }
  if (row.lastReading === fuelRec.odometer) {
    const sameDay =
      row.lastReadingDate && formatUsDate(row.lastReadingDate) === formatUsDate(fuelRec.at);
    if (sameDay) return { ok: false, skip: "unchanged" };
  }
  return { ok: true };
}

export function proposeOilSheetUpdates({
  sheetRows,
  oilChanges,
  fuelReadings,
  idIndex,
  spreadsheetId,
  tab = UPDATE_TAB,
} = {}) {
  if (spreadsheetId === ORIGINAL_TEMPLATE_ID) {
    throw new Error("Refusing write to the original PDI oil-change template");
  }
  const summary = {
    vehicles: sheetRows.length,
    oilWrites: 0,
    readingWrites: 0,
    unchanged: 0,
    unmatchedFuel: 0,
    unmatchedOil: 0,
    skippedBackward: 0,
    skippedJump: 0,
    skippedOlder: 0,
  };
  const patches = [];

  for (const row of sheetRows) {
    const oilRec = lookupOil(row, oilChanges, idIndex);
    const fuelRec = lookupFuel(row, fuelReadings, idIndex);
    if (!oilRec) summary.unmatchedOil += 1;
    if (!fuelRec) summary.unmatchedFuel += 1;

    const writeOil = shouldWriteOil(row, oilRec);
    const nextOil = writeOil ? oilRec.odometer : row.lastOil;
    const reading = shouldWriteReading(row, fuelRec, nextOil);

    const oilValues = writeOil
      ? [oilRec.odometer, formatUsDate(oilRec.completed)]
      : null;
    const readingValues =
      reading.ok && fuelRec ? [fuelRec.odometer, formatUsDate(fuelRec.at)] : null;

    if (!reading.ok) {
      if (reading.skip === "backward") summary.skippedBackward += 1;
      if (reading.skip === "suspect-jump") summary.skippedJump += 1;
      if (reading.skip === "older-reading") summary.skippedOlder += 1;
    }

    if (!oilValues && !readingValues) {
      summary.unchanged += 1;
      continue;
    }

    let startCol;
    let values;
    if (oilValues && readingValues) {
      startCol = "E";
      values = [...oilValues, ...readingValues];
      summary.oilWrites += 1;
      summary.readingWrites += 1;
    } else if (oilValues) {
      startCol = "E";
      values = oilValues;
      summary.oilWrites += 1;
    } else {
      startCol = "G";
      values = readingValues;
      summary.readingWrites += 1;
    }
    const endCol = startCol === "E" ? (values.length === 4 ? "H" : "F") : "H";
    const range = `'${tab}'!${startCol}${row.sheetRow}:${endCol}${row.sheetRow}`;
    assertWritableOilRange(spreadsheetId || "copy", range);
    patches.push({
      sheetRow: row.sheetRow,
      vehicle: row.vehicle,
      range,
      values: [values],
    });
  }

  return { patches, summary };
}

export function assertUpdateTarget(spreadsheetId, { allowWorkingSheet = false } = {}) {
  if (spreadsheetId === ORIGINAL_TEMPLATE_ID) {
    throw new Error("Refusing write to the original PDI oil-change template");
  }
  if (!allowWorkingSheet && spreadsheetId === WORKING_SHEET_ID) {
    throw new Error("Refusing write to the live Automations Copy; use the dated update copy");
  }
}
