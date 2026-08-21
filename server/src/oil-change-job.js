import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDueList,
  formatDueListReport,
  parseFleetCsv,
  resolveWorkingSheet,
  reviewDueList,
  summarizeDueList,
} from "./oil-changes.js";
import { getSheetValues, sheetsConfigured, valuesToCsv } from "./clients/sheets.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_CSV = resolve(__dirname, "../test/fixtures/oil-changes-sample.csv");

export function resolveOilChangeCsvPath(env = process.env) {
  if (env.OIL_CHANGE_CSV_PATH) return env.OIL_CHANGE_CSV_PATH;
  const live = resolve(__dirname, "../../data/efleets-all-cars.csv");
  if (existsSync(live)) return live;
  return SAMPLE_CSV;
}

export function loadOilChangeCsv(csvPath = resolveOilChangeCsvPath()) {
  if (!existsSync(csvPath)) {
    throw new Error(`Oil-change CSV not found at ${csvPath}`);
  }
  return readFileSync(csvPath, "utf8");
}

export async function loadOilChangeFromSheets({
  spreadsheetId,
  range,
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  const sheet = resolveWorkingSheet(env);
  const res = await getSheetValues({
    spreadsheetId: spreadsheetId || sheet.id,
    range: range || sheet.range,
    env,
    fetchImpl,
  });
  if (!res.ok) {
    throw new Error(`Sheets values.get failed (${res.status})`);
  }
  return valuesToCsv(res.json?.values ?? []);
}

export async function runOilDueListJob({ csvPath, csvText, env = process.env, fetchImpl = fetch } = {}) {
  let sourcePath;
  let text = csvText;
  if (text) {
    sourcePath = "(inline)";
  } else if (csvPath) {
    sourcePath = csvPath;
    text = loadOilChangeCsv(csvPath);
  } else if (sheetsConfigured(env)) {
    const sheet = resolveWorkingSheet(env);
    sourcePath = `sheets:${sheet.id}#${sheet.gid}`;
    text = await loadOilChangeFromSheets({ env, fetchImpl });
  } else {
    sourcePath = resolveOilChangeCsvPath(env);
    text = loadOilChangeCsv(sourcePath);
  }
  const vehicles = parseFleetCsv(text);
  const due = buildDueList(vehicles);
  const review = reviewDueList(due);
  const report = formatDueListReport(due);
  return {
    sourcePath,
    usingSample: sourcePath === SAMPLE_CSV,
    workingSheet: resolveWorkingSheet(env),
    generatedAt: new Date().toISOString(),
    summary: summarizeDueList(due),
    report,
    review,
    counts: {
      vehicles: vehicles.length,
      overdue: due.overdue.length,
      suspect: due.suspect.length,
      backward: due.backward.length,
      incomplete: due.incomplete.length,
    },
    overdue: due.overdue.map(publicRow),
    suspect: due.suspect.map(publicRow),
    backward: due.backward.map(publicRow),
  };
}

function publicRow(row) {
  return {
    region: row.region,
    vehicle: row.vehicle,
    plate: row.plate,
    lastOil: row.lastOil,
    lastReading: row.lastReading,
    remaining: row.remaining,
    milesSinceOil: row.milesSinceOil,
    status: row.status,
    notes: row.staleOilNote || "",
    eFleetsId: row.eFleetsId,
  };
}
