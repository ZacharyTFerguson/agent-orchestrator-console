import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDueList,
  formatDueListReport,
  parseFleetCsv,
  reviewDueList,
  summarizeDueList,
} from "./oil-changes.js";

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

export function runOilDueListJob({ csvPath, csvText } = {}) {
  const sourcePath = csvPath || (csvText ? "(inline)" : resolveOilChangeCsvPath());
  const text = csvText ?? loadOilChangeCsv(sourcePath);
  const vehicles = parseFleetCsv(text);
  const due = buildDueList(vehicles);
  const review = reviewDueList(due);
  const report = formatDueListReport(due);
  return {
    sourcePath,
    usingSample: sourcePath === SAMPLE_CSV,
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
