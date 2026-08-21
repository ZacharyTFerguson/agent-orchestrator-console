/**
 * Parse Enterprise eFleets portal CSV exports (company 583424).
 *
 * DETAILS = fuel-card odometer at a known date/time (Last Reading source).
 * Maintenance = completed shop ROs (Last Oil source when the RO is an oil change).
 * Fleet Summary is only an ID index. Calculated Mileage is never Last Reading.
 */
import { parseCsv, parseMiles } from "./oil-changes.js";

export const OIL_CHANGE_SERVICE_EXACT = new Set([
  "full synthetic lube oil filter",
  "semi-synthetic lube oil filter",
  "conventional lube oil and filter",
  "oil change",
  "full synthetic engine oil",
  "semi synthetic engine oil",
]);

export function normalizeFleetKey(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function isOilChangeService(desc) {
  const d = String(desc ?? "")
    .trim()
    .toLowerCase();
  if (!d) return false;
  if (d.includes("surcharge")) return false;
  if (d.includes("air filter")) return false;
  if (d.includes("drain plug")) return false;
  if (d.includes("chassis")) return false;
  if (d === "oil filter engine" || d === "oil filter") return false;
  if (OIL_CHANGE_SERVICE_EXACT.has(d)) return true;
  if (d.includes("lube oil filter")) return true;
  if (d.includes("lube oil and filter")) return true;
  if (d.includes("oil change")) return true;
  return false;
}

export function parseUsDate(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function parseUsDateTime(dateValue, timeValue) {
  const date = parseUsDate(dateValue);
  if (!date) return null;
  const t = String(timeValue ?? "").trim();
  if (!t) return date;
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return date;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = Number(m[3] || 0);
  const ampm = (m[4] || "").toUpperCase();
  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  date.setUTCHours(hour, minute, second, 0);
  return date;
}

export function formatUsDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}

function headerMap(row) {
  const map = {};
  row.forEach((h, i) => {
    map[String(h ?? "").trim().toLowerCase()] = i;
  });
  return map;
}

function cell(row, map, name) {
  const idx = map[name];
  if (idx == null) return "";
  return String(row[idx] ?? "").trim();
}

function findNamedHeader(rows, required) {
  for (let i = 0; i < rows.length; i += 1) {
    const map = headerMap(rows[i]);
    if (required.every((name) => name in map)) {
      return { index: i, map };
    }
  }
  throw new Error(`Could not find header row with ${required.join(", ")}`);
}

export function parseLatestFuelReadings(csvText) {
  const rows = parseCsv(csvText);
  const { index, map } = findNamedHeader(rows, ["vehicle", "provider odometer"]);
  const latestAny = new Map();
  const latestClean = new Map();

  for (const row of rows.slice(index + 1)) {
    const eFleetsId = normalizeFleetKey(cell(row, map, "vehicle"));
    const odometer = parseMiles(cell(row, map, "provider odometer"));
    const when = parseUsDateTime(
      cell(row, map, "provider transaction date"),
      cell(row, map, "provider transaction time")
    );
    const unusual = cell(row, map, "provider unusual odometer flag").toUpperCase();
    if (!eFleetsId || odometer == null || odometer <= 0 || !when) continue;
    const rec = { eFleetsId, odometer, at: when, unusual };
    const prev = latestAny.get(eFleetsId);
    if (!prev || when > prev.at) latestAny.set(eFleetsId, rec);
    if (unusual !== "Y") {
      const prevClean = latestClean.get(eFleetsId);
      if (!prevClean || when > prevClean.at) latestClean.set(eFleetsId, rec);
    }
  }

  return { latestAny, latestClean };
}

export function parseCompletedOilChanges(csvText) {
  const rows = parseCsv(csvText);
  const { index, map } = findNamedHeader(rows, ["ro id", "service desc", "odometer"]);
  const byRo = new Map();

  for (const row of rows.slice(index + 1)) {
    const status = (cell(row, map, "ro status*") || cell(row, map, "ro status")).toLowerCase();
    if (status !== "work completed") continue;
    if (!isOilChangeService(cell(row, map, "service desc"))) continue;
    const roId = cell(row, map, "ro id");
    const eFleetsId = normalizeFleetKey(cell(row, map, "vehicle"));
    const unit = normalizeFleetKey(cell(row, map, "customer vehicle id"));
    const odometer = parseMiles(cell(row, map, "odometer"));
    const completed = parseUsDate(cell(row, map, "ro completed date"));
    if (!roId || !eFleetsId || odometer == null || !completed) continue;
    const rec = { roId, eFleetsId, unit, odometer, completed };
    const prev = byRo.get(roId);
    if (!prev) byRo.set(roId, rec);
  }

  const latestByUnit = new Map();
  const latestByEfleets = new Map();
  for (const rec of byRo.values()) {
    const prevE = latestByEfleets.get(rec.eFleetsId);
    if (!prevE || rec.completed > prevE.completed || (rec.completed.getTime() === prevE.completed.getTime() && rec.odometer > prevE.odometer)) {
      latestByEfleets.set(rec.eFleetsId, rec);
    }
    if (rec.unit) {
      const prevU = latestByUnit.get(rec.unit);
      if (!prevU || rec.completed > prevU.completed || (rec.completed.getTime() === prevU.completed.getTime() && rec.odometer > prevU.odometer)) {
        latestByUnit.set(rec.unit, rec);
      }
    }
  }
  return { byRo, latestByEfleets, latestByUnit };
}

export function parseFleetIdIndex(csvText) {
  const rows = parseCsv(csvText);
  const { index, map } = findNamedHeader(rows, ["vehicle"]);
  const byEfleets = new Map();
  const byUnit = new Map();
  const unitHeader = "customer vehicle id**" in map ? "customer vehicle id**" : "customer vehicle id";
  for (const row of rows.slice(index + 1)) {
    const eFleetsId = normalizeFleetKey(cell(row, map, "vehicle"));
    const unit = normalizeFleetKey(cell(row, map, unitHeader));
    if (!eFleetsId) continue;
    const rec = { eFleetsId, unit };
    byEfleets.set(eFleetsId, rec);
    if (unit) byUnit.set(unit, rec);
  }
  return { byEfleets, byUnit };
}
