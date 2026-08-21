import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isOilChangeService,
  parseCompletedOilChanges,
  parseLatestFuelReadings,
  parseFleetIdIndex,
  parseUsDate,
} from "../src/efleets-exports.js";
import {
  parseSheetVehicleRows,
  proposeOilSheetUpdates,
  assertUpdateTarget,
  applyPatchesToVehicleRows,
  chunkPatches,
  toSheetValueRanges,
} from "../src/oil-sheet-update.js";
import { ORIGINAL_TEMPLATE_ID, WORKING_SHEET_ID, classifyVehicle } from "../src/oil-changes.js";
import { fuelsAreConsistent, loadCardHomes } from "../src/oil-card-homes.js";

const SHEET = `legend
,,,
Region,Vehicle,YEAR,Plate #,Last Oil Change Completed,Date,Last Reading,Date,Change oil at 0,Mileage due at,notes,Last Safety Inspection,eFleets ID
EAST
EAST,UNIT-A,2024,,10000,7/1/2026,11000,8/1/2026,0,15000,-,,EF1
EAST,UNIT-B,2024,,20000,7/1/2026,21000,8/1/2026,0,25000,-,,EF2
`;

const MAINT = `RO Created Date,RO Completed Date,RO Status*,RO ID,Vehicle,Driver,VIN,License Num,Customer Vehicle ID,Maint Cost Code,Year,Make,Model,Odometer,RO Item ID,Service Desc
7/1/2026,8/10/2026,Work Completed,RO1,EF1,,,UNIT-A,,,,2024,,12000,1,Full Synthetic Lube Oil Filter
7/1/2026,8/10/2026,Work Completed,RO1,EF1,,,UNIT-A,,,,2024,,12000,2,Oil Filter Engine
8/1/2026,8/11/2026,Approved,RO2,EF2,,,UNIT-B,,,,2024,,25000,1,Oil Change
`;

const DETAILS = `Master Cust Num,Vehicle,Provider Transaction Date,Provider Transaction Time,Provider Odometer,Provider Unusual Odometer Flag
1,EF1,8/12/2026,09:00:00 AM,13000,N
1,EF1,8/13/2026,09:00:00 AM,900000,Y
1,EF2,8/12/2026,09:00:00 AM,18000,N
`;

test("oil-change service matcher ignores filters and surcharges", () => {
  assert.equal(isOilChangeService("Full Synthetic Lube Oil Filter"), true);
  assert.equal(isOilChangeService("Oil Change"), true);
  assert.equal(isOilChangeService("Oil Filter Engine"), false);
  assert.equal(isOilChangeService("Oil Surcharge"), false);
  assert.equal(isOilChangeService("Cabin Air Filter"), false);
});

test("completed oil ROs keep the latest Work Completed lube job", () => {
  const oil = parseCompletedOilChanges(MAINT);
  assert.equal(oil.latestByEfleets.get("EF1").odometer, 12000);
  assert.equal(oil.latestByEfleets.has("EF2"), false);
});

test("fuel readings skip unusual odometer flags", () => {
  const fuel = parseLatestFuelReadings(DETAILS);
  assert.equal(fuel.latestClean.get("EF1").odometer, 13000);
  assert.equal(fuel.latestAny.get("EF1").odometer, 900000);
});

test("two-digit dates parse as 20xx", () => {
  assert.equal(parseUsDate("8/10/26")?.toISOString().slice(0, 10), "2026-08-10");
  assert.equal(parseUsDate("8/10/2026")?.toISOString().slice(0, 10), "2026-08-10");
  assert.equal(parseUsDate("08/20/2026")?.toISOString().slice(0, 10), "2026-08-20");
});

test("updater writes oil and reading and never I/J", () => {
  const { vehicles } = parseSheetVehicleRows(SHEET);
  const proposed = proposeOilSheetUpdates({
    sheetRows: vehicles,
    oilChanges: parseCompletedOilChanges(MAINT),
    fuelReadings: parseLatestFuelReadings(DETAILS),
    spreadsheetId: "copy-id-not-template",
  });
  assert.equal(proposed.summary.oilWrites, 1);
  assert.equal(proposed.summary.readingWrites, 1);
  assert.equal(proposed.patches.length, 1);
  assert.equal(proposed.patches[0].range, "'eFleets All Cars sorted'!E5:H5");
  assert.deepEqual(proposed.patches[0].values[0], [12000, "8/10/2026", 13000, "8/12/2026"]);
  assert.doesNotMatch(proposed.patches[0].range, /![IJ]|:[IJ]/);
  const after = applyPatchesToVehicleRows(vehicles, proposed.patches);
  assert.equal(classifyVehicle(after[0]).status, "ok");
});

test("three in-band fuels are enough to treat a fighting oil odo as fat-fingered", () => {
  assert.equal(fuelsAreConsistent([{ odometer: 274100 }, { odometer: 275000 }, { odometer: 275879 }]).ok, true);
  assert.equal(fuelsAreConsistent([{ odometer: 275879 }]).reason, "NEED_THREE_FUELS");
});

test("updater skips backward and suspect jumps", () => {
  const sheet = `Region,Vehicle,YEAR,Plate #,Last Oil Change Completed,Date,Last Reading,Date,Change oil at 0,Mileage due at,notes,Last Safety Inspection,eFleets ID
EAST,UNIT-C,2024,,50000,7/1/2026,51000,8/1/2026,0,55000,-,,EF3
`;
  const details = `Vehicle,Provider Transaction Date,Provider Transaction Time,Provider Odometer,Provider Unusual Odometer Flag
EF3,8/12/2026,09:00:00 AM,10000,N
`;
  const proposed = proposeOilSheetUpdates({
    sheetRows: parseSheetVehicleRows(sheet).vehicles,
    oilChanges: parseCompletedOilChanges(MAINT),
    fuelReadings: parseLatestFuelReadings(details),
    spreadsheetId: "copy-id",
  });
  assert.equal(proposed.summary.skippedBackward, 1);
  assert.equal(proposed.patches.length, 0);
});

test("fleet index maps unit name to eFleets id when column M is empty", () => {
  const sheet = `Region,Vehicle,YEAR,Plate #,Last Oil Change Completed,Date,Last Reading,Date,Change oil at 0,Mileage due at,notes,Last Safety Inspection,eFleets ID
EAST,UNIT-A,2024,,10000,7/1/2026,11000,8/1/2026,0,15000,-,,
`;
  const fleet = `Vehicle,Customer Vehicle ID**
EF1,UNIT-A
`;
  const proposed = proposeOilSheetUpdates({
    sheetRows: parseSheetVehicleRows(sheet).vehicles,
    oilChanges: parseCompletedOilChanges(MAINT),
    fuelReadings: parseLatestFuelReadings(DETAILS),
    idIndex: parseFleetIdIndex(fleet),
    spreadsheetId: "copy-id",
  });
  assert.equal(proposed.summary.oilWrites, 1);
  assert.equal(proposed.summary.readingWrites, 1);
  assert.equal(proposed.patches[0].range, "'eFleets All Cars sorted'!E2:H2");
});

test("refuses the original template and live working sheet", () => {
  assert.throws(() => assertUpdateTarget(ORIGINAL_TEMPLATE_ID), /original PDI/);
  assert.throws(() => assertUpdateTarget(WORKING_SHEET_ID), /dated update copy/);
  assert.doesNotThrow(() => assertUpdateTarget("1F3KrNhD8xDvIlyumigiQzVkK_C9FaDKOVdJaCX_yASE"));
});

test("chunked apply payloads keep range and values only", () => {
  const patches = [
    { sheetRow: 5, vehicle: "UNIT-A", range: "'eFleets All Cars sorted'!E5:F5", values: [[1, "8/1/2026"]] },
    { sheetRow: 6, vehicle: "UNIT-B", range: "'eFleets All Cars sorted'!G6:H6", values: [[2, "8/2/2026"]] },
  ];
  const chunks = chunkPatches(patches, 1);
  assert.equal(chunks.length, 2);
  assert.deepEqual(toSheetValueRanges(chunks[0]), [
    { range: "'eFleets All Cars sorted'!E5:F5", values: [[1, "8/1/2026"]], majorDimension: "ROWS" },
  ]);
});

test("shared unit nicknames do not copy one oil RO onto both rows", () => {
  const sheet = `Region,Vehicle,YEAR,Plate #,Last Oil Change Completed,Date,Last Reading,Date,Change oil at 0,Mileage due at,notes,Last Safety Inspection,eFleets ID
PA,PA14,2023,,121589,6/12/2026,124000,8/12/2026,0,126589,-,,EFOLD
PA,PA14,2025,,35405,7/2/2026,41500,8/11/2026,0,40405,-,,EFNEW
`;
  const maint = `RO Completed Date,RO Status*,RO ID,Vehicle,Customer Vehicle ID,Odometer,Service Desc
8/18/2026,Work Completed,RO-NEW,EFNEW,PA14,42212,Oil Change
`;
  const details = `Vehicle,Provider Transaction Date,Provider Transaction Time,Provider Odometer,Provider Unusual Odometer Flag
EFNEW,8/19/2026,09:00:00 AM,42435,N
`;
  const proposed = proposeOilSheetUpdates({
    sheetRows: parseSheetVehicleRows(sheet).vehicles,
    oilChanges: parseCompletedOilChanges(maint),
    fuelReadings: parseLatestFuelReadings(details),
    spreadsheetId: "copy-id",
  });
  const oldRow = proposed.patches.find((p) => p.sheetRow === 2);
  const newRow = proposed.patches.find((p) => p.sheetRow === 3);
  assert.equal(oldRow, undefined);
  assert.ok(newRow);
  assert.equal(newRow.values[0][0], 42212);
});

test("card-home remap moves host fuel onto the home vehicle", () => {
  const sheet = `Region,Vehicle,YEAR,Plate #,Last Oil Change Completed,Date,Last Reading,Date,Change oil at 0,Mileage due at,notes,Last Safety Inspection,eFleets ID
PA,PA9,2024,,23464,12/20/2025,129143,8/12/2026,0,28464,-,,285JCH
PA,PA21,2024,,129622,8/17/2026,42806,5/3/2026,0,134622,-,,285JCR
`;
  const maint = `RO Completed Date,RO Status*,RO ID,Vehicle,Customer Vehicle ID,Odometer,Service Desc
8/17/2026,Work Completed,RO-PA21,285JCR,PA21,129622,Oil Change
`;
  const details = `Vehicle,Provider Transaction Date,Provider Transaction Time,Provider Odometer,Provider Unusual Odometer Flag
285JCH,8/18/2026,09:00:00 AM,130209,N
`;
  const proposed = proposeOilSheetUpdates({
    sheetRows: parseSheetVehicleRows(sheet).vehicles,
    oilChanges: parseCompletedOilChanges(maint),
    fuelReadings: parseLatestFuelReadings(details),
    spreadsheetId: "copy-id",
    cardHomes: loadCardHomes(),
  });
  const pa9 = proposed.patches.find((p) => p.vehicle === "PA9");
  const pa21 = proposed.patches.find((p) => p.vehicle === "PA21");
  assert.equal(pa9, undefined);
  assert.ok(pa21);
  assert.equal(pa21.values[0].includes(130209), true);
  assert.doesNotMatch(JSON.stringify(proposed.patches), /129143/);
});
