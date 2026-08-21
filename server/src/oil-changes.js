/**
 * PDI oil-change due-list engine.
 *
 * Takes over GrokBot's "internet bot" overdue report:
 *   CHANGE OIL AFTER 5K on Automations Copy → eFleets All Cars sorted.
 *
 * Never edits the original PDI template. Never writes columns I/J.
 * Does not log into eFleets or OneStep.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OIL_SHEET = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../config/oil-sheet.json"), "utf8")
);

export const OIL_INTERVAL_MILES = 5000;
export const JUMP_SUSPECT_MILES = 30_000;
export const WORKING_SHEET_ID = OIL_SHEET.spreadsheetId;
export const WORKING_SHEET_GID = OIL_SHEET.gid;
export const WORKING_SHEET_TAB = OIL_SHEET.tab;
export const WORKING_SHEET_URL = OIL_SHEET.url;
export const ORIGINAL_TEMPLATE_ID = OIL_SHEET.originalTemplateId;

/** This Cloud Agent environment's working oil sheet (Automations Copy). */
export function resolveWorkingSheet(env = process.env) {
  const id = env.OIL_CHANGE_SHEET_ID || WORKING_SHEET_ID;
  const gid = env.OIL_CHANGE_SHEET_GID || WORKING_SHEET_GID;
  const tab = env.OIL_CHANGE_SHEET_TAB || WORKING_SHEET_TAB;
  return {
    id,
    gid,
    tab,
    title: OIL_SHEET.title,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit?gid=${gid}#gid=${gid}`,
    range: `'${tab}'!A1:T`,
  };
}

export function parseMiles(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === "-" || s === "—" || s === "–") return null;
  const cleaned = s.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const src = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n") {
      pushField();
      pushRow();
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  return rows;
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = rows[i].map(normalizeHeader);
    const hasVehicle = normalized.some((h) => h === "vehicle");
    const hasLastOil = normalized.some((h) => h.includes("last oil change"));
    const hasLastReading = normalized.some((h) => h === "last reading");
    if (hasVehicle && hasLastOil && hasLastReading) {
      return { index: i, headers: normalized };
    }
  }
  throw new Error("Could not find the eFleets All Cars header row (Vehicle / Last Oil Change / Last Reading)");
}

function columnIndex(headers, matcher) {
  const idx = headers.findIndex(matcher);
  return idx === -1 ? null : idx;
}

function cell(row, idx) {
  if (idx == null) return "";
  return String(row[idx] ?? "").trim();
}

function looksLikeHeaderOrSpacer(vehicle, region) {
  if (!vehicle) return true;
  if (vehicle === "-" || vehicle === "—") return true;
  const v = vehicle.toLowerCase();
  if (v === "vehicle" || v === "region") return true;
  if (!region && /^[a-z]+$/i.test(vehicle) && vehicle.length <= 12 && v === vehicle.toLowerCase() && vehicle === vehicle.toUpperCase()) {
    return false;
  }
  return false;
}

export function classifyVehicle(row) {
  const lastOil = row.lastOil;
  const lastReading = row.lastReading;
  if (lastOil == null || lastReading == null) {
    return { ...row, status: "incomplete", remaining: null, milesSinceOil: null };
  }

  const milesSinceOil = lastReading - lastOil;
  const remaining = lastOil + OIL_INTERVAL_MILES - lastReading;
  const notes = row.notes || "";

  if (lastReading < lastOil) {
    return { ...row, status: "backward", remaining, milesSinceOil };
  }
  if (milesSinceOil > JUMP_SUSPECT_MILES) {
    return { ...row, status: "suspect", remaining, milesSinceOil };
  }
  if (remaining <= 0) {
    return { ...row, status: "overdue", remaining, milesSinceOil, staleOilNote: oilStaleNote(notes) };
  }
  return { ...row, status: "ok", remaining, milesSinceOil };
}

function oilStaleNote(notes) {
  if (!notes) return "";
  const lower = notes.toLowerCase();
  if (lower.includes("oil chang") || lower.includes("oil done") || lower.includes("oil was done")) {
    return notes.replace(/\s+/g, " ").trim();
  }
  return "";
}

export function parseFleetCsv(text) {
  const rows = parseCsv(text);
  const { index, headers } = findHeaderRow(rows);

  const vehicleIdx = columnIndex(headers, (h) => h === "vehicle");
  const regionIdx = columnIndex(headers, (h) => h === "region");
  const plateIdx = columnIndex(headers, (h) => h.includes("plate"));
  const lastOilIdx = columnIndex(headers, (h) => h.includes("last oil change"));
  const lastReadingIdx = columnIndex(headers, (h) => h === "last reading");
  const remainingIdx = columnIndex(headers, (h) => h.includes("change oil at 0"));
  const notesIdx = columnIndex(headers, (h) => h === "notes");
  const eFleetsIdx = columnIndex(headers, (h) => h.includes("efleets"));

  if (vehicleIdx == null || lastOilIdx == null || lastReadingIdx == null) {
    throw new Error("Fleet CSV is missing Vehicle, Last Oil Change Completed, or Last Reading columns");
  }

  const vehicles = [];
  for (const raw of rows.slice(index + 1)) {
    const vehicle = cell(raw, vehicleIdx);
    const region = cell(raw, regionIdx);
    if (looksLikeHeaderOrSpacer(vehicle, region)) continue;

    const parsed = classifyVehicle({
      region,
      vehicle,
      plate: normalizePlate(cell(raw, plateIdx)),
      lastOil: parseMiles(cell(raw, lastOilIdx)),
      lastReading: parseMiles(cell(raw, lastReadingIdx)),
      sheetRemaining: parseMiles(cell(raw, remainingIdx)),
      notes: cell(raw, notesIdx),
      eFleetsId: cell(raw, eFleetsIdx),
    });
    vehicles.push(parsed);
  }
  return vehicles;
}

function normalizePlate(plate) {
  if (!plate || plate === "-" || plate === "—") return "";
  return plate;
}

export function buildDueList(vehicles) {
  const overdue = vehicles.filter((v) => v.status === "overdue");
  const suspect = vehicles.filter((v) => v.status === "suspect");
  const backward = vehicles.filter((v) => v.status === "backward");
  const incomplete = vehicles.filter((v) => v.status === "incomplete");
  overdue.sort((a, b) => a.remaining - b.remaining);
  return { vehicles, overdue, suspect, backward, incomplete };
}

export function formatVehicleLine(row) {
  const plate = row.plate ? ` ${row.plate}` : "";
  const overdueMiles = Math.abs(Math.round(row.remaining ?? 0));
  let line = `${row.vehicle}${plate}, ${overdueMiles.toLocaleString("en-US")} overdue`;
  if (row.staleOilNote) {
    line += ` (${row.staleOilNote})`;
  }
  return line;
}

export function formatSuspectLine(row) {
  const plate = row.plate ? ` ${row.plate}` : "";
  const lastOil = row.lastOil?.toLocaleString("en-US") ?? "—";
  const lastReading = row.lastReading?.toLocaleString("en-US") ?? "—";
  return `${row.vehicle}${plate}, last oil ${lastOil} vs last reading ${lastReading}`;
}

export function formatBackwardLine(row) {
  const plate = row.plate ? ` ${row.plate}` : "";
  const lastOil = row.lastOil?.toLocaleString("en-US") ?? "—";
  const lastReading = row.lastReading?.toLocaleString("en-US") ?? "—";
  return `${row.vehicle}${plate}, last reading ${lastReading} vs last oil ${lastOil}`;
}

export function formatDueListReport(due, { sourceLabel } = {}) {
  const source =
    sourceLabel ||
    `Automations copy, tab eFleets All Cars sorted. Rule is CHANGE OIL AFTER ${OIL_INTERVAL_MILES / 1000}K.`;

  const lines = [
    `Here is the current overdue list from the ${source}`,
    "",
    `Change oil (overdue), ${due.overdue.length} units:`,
    "",
  ];
  for (const row of due.overdue) lines.push(formatVehicleLine(row));

  if (due.suspect.length > 0) {
    lines.push("");
    lines.push("Readings that look wrong, not counted as due:");
    lines.push("");
    for (const row of due.suspect) lines.push(formatSuspectLine(row));
  }

  if (due.backward.length > 0) {
    lines.push("");
    lines.push(
      "A few last readings sit below the last oil change, so those are not counted as due either:"
    );
    lines.push("");
    for (const row of due.backward) lines.push(formatBackwardLine(row));
  }

  lines.push("");
  lines.push(
    `Source: ${resolveWorkingSheet().url}`
  );
  lines.push("Owner: Cursor oil-change agents (took over from GrokBot).");
  return lines.join("\n");
}

export function summarizeDueList(due) {
  return `Oil due-list: ${due.overdue.length} overdue, ${due.suspect.length} suspect, ${due.backward.length} backward`;
}

export function reviewDueList(due) {
  const failures = [];
  for (const row of due.overdue) {
    if (row.status !== "overdue") failures.push(`OVERDUE_POLLUTED:${row.vehicle}`);
    if (row.lastReading < row.lastOil) failures.push(`BACKWARD_AS_DUE:${row.vehicle}`);
    if (row.lastReading - row.lastOil > JUMP_SUSPECT_MILES) failures.push(`SUSPECT_AS_DUE:${row.vehicle}`);
  }
  return {
    ok: failures.length === 0,
    failures,
    overdueCount: due.overdue.length,
    suspectCount: due.suspect.length,
    backwardCount: due.backward.length,
  };
}

export function looksLikeOilChangeRequest(text) {
  const t = String(text ?? "").toLowerCase();
  if (!t.trim()) return false;
  if (t.includes("oil change") || t.includes("oil-change")) return true;
  if (t.includes("overdue") && (t.includes("vehicle") || t.includes("car") || t.includes("fleet"))) return true;
  if (t.includes("how are the vehicle") || t.includes("how are the cars")) return true;
  if (t.includes("need an oil") || t.includes("needs an oil")) return true;
  return false;
}
