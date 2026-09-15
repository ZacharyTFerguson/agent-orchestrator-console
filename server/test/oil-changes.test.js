import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  JUMP_SUSPECT_MILES,
  OIL_INTERVAL_MILES,
  buildDueList,
  classifyVehicle,
  formatDueListReport,
  looksLikeOilChangeRequest,
  parseFleetCsv,
  parseMiles,
  resolveWorkingSheet,
  reviewDueList,
} from "../src/oil-changes.js";
import { runOilDueListJob } from "../src/oil-change-job.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE = resolve(__dirname, "fixtures/oil-changes-sample.csv");

test("parseMiles accepts US thousands and negatives", () => {
  assert.equal(parseMiles("211,370"), 211370);
  assert.equal(parseMiles("-2,322"), -2322);
  assert.equal(parseMiles("429"), 429);
  assert.equal(parseMiles("-"), null);
  assert.equal(parseMiles(""), null);
});

test("5K remaining matches GrokBot Change oil at 0", () => {
  const overdue = classifyVehicle({ vehicle: "BING-1", lastOil: 211370, lastReading: 218692 });
  assert.equal(overdue.status, "overdue");
  assert.equal(overdue.remaining, -2322);

  const ok = classifyVehicle({ vehicle: "Bing-2", lastOil: 173111, lastReading: 176844 });
  assert.equal(ok.status, "ok");
  assert.equal(ok.remaining, 1267);
});

test("suspect jump matches GrokBot uncounted dirty readings", () => {
  const nj9 = classifyVehicle({ vehicle: "NJ9", lastOil: 18431, lastReading: 151298 });
  assert.equal(nj9.status, "suspect");
  assert.ok(nj9.milesSinceOil > JUMP_SUSPECT_MILES);

  const nj1 = classifyVehicle({ vehicle: "NJ1", lastOil: 63524, lastReading: 87000 });
  assert.equal(nj1.status, "overdue");
  assert.ok(nj1.milesSinceOil <= JUMP_SUSPECT_MILES);
});

test("backward odometers are not treated as due", () => {
  const row = classifyVehicle({ vehicle: "PA21", lastOil: 122355, lastReading: 42806 });
  assert.equal(row.status, "backward");
});

test("sample CSV produces overdue, suspect, backward, incomplete", () => {
  const vehicles = parseFleetCsv(readFileSync(SAMPLE, "utf8"));
  const due = buildDueList(vehicles);
  assert.deepEqual(
    due.overdue.map((v) => v.vehicle).sort(),
    ["UNIT-A", "UNIT-C", "UNIT-G"]
  );
  assert.deepEqual(
    due.suspect.map((v) => v.vehicle).sort(),
    ["UNIT-E", "UNIT-H"]
  );
  assert.deepEqual(
    due.backward.map((v) => v.vehicle),
    ["UNIT-F"]
  );
  assert.deepEqual(
    due.incomplete.map((v) => v.vehicle),
    ["UNIT-D"]
  );
  assert.equal(due.overdue.find((v) => v.vehicle === "UNIT-A").remaining, -2322);
  assert.match(due.overdue.find((v) => v.vehicle === "UNIT-G").staleOilNote, /oil changed/i);
});

test("report format matches the GrokBot overdue email shape", () => {
  const due = buildDueList(parseFleetCsv(readFileSync(SAMPLE, "utf8")));
  const report = formatDueListReport(due);
  assert.match(report, /Change oil \(overdue\), 3 units:/);
  assert.match(report, /UNIT-A AAA111, 2,322 overdue/);
  assert.match(report, /not counted as due/);
  assert.match(report, /UNIT-E EEE555/);
  assert.match(report, /sit below the last oil change/);
  assert.match(report, /took over from GrokBot/);
});

test("reviewer rejects a polluted overdue list", () => {
  const due = buildDueList(parseFleetCsv(readFileSync(SAMPLE, "utf8")));
  assert.equal(reviewDueList(due).ok, true);
  due.overdue.push(due.suspect[0]);
  const review = reviewDueList(due);
  assert.equal(review.ok, false);
  assert.ok(review.failures.some((f) => f.startsWith("SUSPECT_AS_DUE")));
});

test("job loads the sample fixture by default when no live CSV is set", async () => {
  const result = await runOilDueListJob({ csvPath: SAMPLE });
  assert.equal(result.counts.overdue, 3);
  assert.equal(result.review.ok, true);
  assert.match(result.summary, /3 overdue/);
});

test("oil-change chat detector", () => {
  assert.equal(looksLikeOilChangeRequest("May you send me a list of cars that need an oil change please?"), true);
  assert.equal(looksLikeOilChangeRequest("How are the vehicles looking today?"), true);
  assert.equal(looksLikeOilChangeRequest("hello"), false);
});

test("interval stays at GrokBot's 5K", () => {
  assert.equal(OIL_INTERVAL_MILES, 5000);
});

test("working sheet environment is the Automations Copy gid 733911326", () => {
  const sheet = resolveWorkingSheet();
  assert.equal(sheet.id, "1e0AhA0LTLru0_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ");
  assert.equal(sheet.gid, "733911326");
  assert.equal(sheet.tab, "eFleets All Cars sorted");
  assert.match(sheet.url, /gid=733911326/);
  const override = resolveWorkingSheet({ OIL_CHANGE_SHEET_ID: "other", OIL_CHANGE_SHEET_GID: "1" });
  assert.equal(override.id, "other");
  assert.equal(override.gid, "1");
});
