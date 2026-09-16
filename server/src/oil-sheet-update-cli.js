import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCompletedOilChanges, parseFleetIdIndex, parseLatestFuelReadings } from "./efleets-exports.js";
import {
  applyPatchesToVehicleRows,
  assertUpdateTarget,
  chunkPatches,
  parseSheetVehicleRows,
  proposeOilSheetUpdates,
  toSheetValueRanges,
} from "./oil-sheet-update.js";
import { buildDueList, classifyVehicle } from "./oil-changes.js";

function arg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1];
}

function load(path) {
  return readFileSync(resolve(path), "utf8");
}

function counts(due) {
  return {
    vehicles: due.vehicles.length,
    overdue: due.overdue.length,
    suspect: due.suspect.length,
    backward: due.backward.length,
    incomplete: due.incomplete.length,
  };
}

function main() {
  const sheetPath = arg("--sheet");
  const detailsPath = arg("--details");
  const maintPath = arg("--maintenance");
  const fleetPath = arg("--fleet");
  const spreadsheetId = arg("--spreadsheet-id");
  const outPath = arg("--out");
  const chunkSize = Number(arg("--chunk-size") || 40);
  if (!sheetPath || !detailsPath || !maintPath || !spreadsheetId) {
    process.stderr.write(
      "usage: oil-sheet-update-cli --sheet csv --details csv --maintenance csv --spreadsheet-id id [--fleet csv] [--out json]\n"
    );
    process.exitCode = 2;
    return;
  }

  assertUpdateTarget(spreadsheetId, { allowWorkingSheet: process.argv.includes("--allow-working-sheet") });
  const sheetCsv = load(sheetPath);
  const { vehicles } = parseSheetVehicleRows(sheetCsv);
  const proposed = proposeOilSheetUpdates({
    sheetRows: vehicles,
    oilChanges: parseCompletedOilChanges(load(maintPath)),
    fuelReadings: parseLatestFuelReadings(load(detailsPath)),
    idIndex: fleetPath ? parseFleetIdIndex(load(fleetPath)) : undefined,
    spreadsheetId,
  });

  const before = buildDueList(vehicles.map((row) => classifyVehicle(row)));
  const after = buildDueList(
    applyPatchesToVehicleRows(vehicles, proposed.patches).map((row) => classifyVehicle(row))
  );
  const applyChunks = chunkPatches(proposed.patches, chunkSize).map((chunk) => toSheetValueRanges(chunk));

  const payload = {
    spreadsheetId,
    summary: proposed.summary,
    before: counts(before),
    after: counts(after),
    patchCount: proposed.patches.length,
    chunkCount: applyChunks.length,
    patches: proposed.patches.map((p) => ({
      sheetRow: p.sheetRow,
      range: p.range,
      values: p.values,
    })),
    applyChunks,
  };

  process.stdout.write(
    `${JSON.stringify(
      {
        spreadsheetId: payload.spreadsheetId,
        summary: payload.summary,
        before: payload.before,
        after: payload.after,
        patchCount: payload.patchCount,
        chunkCount: payload.chunkCount,
      },
      null,
      2
    )}\n`
  );
  if (outPath) {
    writeFileSync(resolve(outPath), `${JSON.stringify(payload)}\n`);
  }
}

main();
