import { test } from "node:test";
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";

import { queryString } from "../src/clients/http.js";
import {
  assertWritableOilRange,
  getSheetValues,
  updateSheetValues,
  valuesToCsv,
  sheetsConfigured,
} from "../src/clients/sheets.js";
import {
  composeLastReading,
  extractDistance,
  listDeviceInfo,
  listDevices,
  oneStepConfigured,
  oneStepJwtConfigured,
  resolveOneStepEnv,
  signOneStepJwt,
} from "../src/clients/onestep.js";
import { probeOneStep } from "../src/oil-onestep-probe-cli.js";
import {
  eFleetsCapability,
  parseMileageHistoryExport,
  pickLastFuelFromHistory,
  pickLastOilFromHistory,
} from "../src/clients/efleets.js";
import { integrationStatus } from "../src/clients/index.js";
import { ORIGINAL_TEMPLATE_ID, WORKING_SHEET_ID } from "../src/oil-changes.js";
import { runOilDueListJob } from "../src/oil-change-job.js";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

test("queryString omits empty values and never requires a package", () => {
  assert.equal(queryString({ a: "1", b: "", c: null }), "?a=1");
});

test("Sheets values.get uses official REST and a Bearer token", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return jsonResponse(200, { values: [["Vehicle"], ["UNIT-A"]] });
  };
  const res = await getSheetValues({
    spreadsheetId: WORKING_SHEET_ID,
    range: "'eFleets All Cars sorted'!A1:T",
    env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" },
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/sheets\.googleapis\.com\/v4\/spreadsheets\//);
  assert.match(calls[0].url, /valueRenderOption=UNFORMATTED_VALUE/);
  assert.equal(calls[0].opts.headers.Authorization, "Bearer tok");
  assert.equal(calls[0].url.includes("tok"), false);
});

test("Sheets values.update is blocked on the original template and I/J", async () => {
  const env = { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" };
  await assert.rejects(
    () =>
      updateSheetValues({
        spreadsheetId: ORIGINAL_TEMPLATE_ID,
        range: "K2:K",
        values: [["1"]],
        env,
        fetchImpl: async () => {
          throw new Error("should not fetch");
        },
      }),
    /original PDI/
  );
  await assert.rejects(
    () =>
      updateSheetValues({
        spreadsheetId: WORKING_SHEET_ID,
        range: "'eFleets All Cars sorted'!I2:I",
        values: [["1"]],
        env,
        fetchImpl: async () => {
          throw new Error("should not fetch");
        },
      }),
    /formula columns I\/J/
  );
  assert.doesNotThrow(() => assertWritableOilRange(WORKING_SHEET_ID, "'eFleets All Cars sorted'!K2:K"));
});

test("Sheets values.update PUTs USER_ENTERED values", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return jsonResponse(200, { updatedCells: 1 });
  };
  const res = await updateSheetValues({
    spreadsheetId: WORKING_SHEET_ID,
    range: "K2",
    values: [["218692"]],
    env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" },
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.match(calls[0].url, /valueInputOption=USER_ENTERED/);
  assert.equal(calls[0].opts.method, "PUT");
  const body = JSON.parse(calls[0].opts.body);
  assert.deepEqual(body.values, [["218692"]]);
});

test("valuesToCsv quotes commas", () => {
  assert.equal(valuesToCsv([["a,b", "c"]]), '"a,b",c');
});

test("due-list job can load from Sheets when a token is set", async () => {
  const fetchImpl = async () =>
    jsonResponse(200, {
      values: [
        ["Region", "Vehicle", "YEAR", "Plate #", "Last Oil Change Completed", "Date", "Last Reading", "Date"],
        ["DEMO", "UNIT-A", "2021", "AAA111", "211370", "6/26/2026", "218692", "8/12/2026"],
      ],
    });
  const result = await runOilDueListJob({
    env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" },
    fetchImpl,
  });
  assert.match(result.sourcePath, /^sheets:/);
  assert.equal(result.counts.overdue, 1);
  assert.equal(result.overdue[0].vehicle, "UNIT-A");
});

test("OneStep extractDistance uses miles, never odometer", () => {
  const ok = extractDistance({ result: { distance_miles: 42, odometer: 999999 } });
  assert.equal(ok.miles, 42);
  assert.equal(ok.sourceField, "distance_miles");

  const unitValue = extractDistance({
    distance: { value: 251.58, unit: "mi", display: "251.6 mi" },
    odometer_from: 1,
    odometer_to: 2,
  });
  assert.equal(unitValue.miles, 251.58);
  assert.equal(unitValue.sourceField, "distance");

  const onlyOdo = extractDistance({ odometer: 12000, mileage: 12000 });
  assert.equal(onlyOdo.miles, null);
  assert.equal(onlyOdo.rejectedOdometer, true);
});

test("Last Reading is Enterprise odo plus OneStep miles since T", () => {
  assert.deepEqual(composeLastReading({ enterpriseOdo: 100000, oneStepMiles: 37 }), {
    skip: false,
    lastReading: 100037,
    method: "MD40_METHOD",
  });
  assert.equal(composeLastReading({ enterpriseOdo: null, oneStepMiles: 10 }).skip, true);
  assert.equal(composeLastReading({ enterpriseOdo: 10, oneStepMiles: null }).reason, "NO_ONESTEP");
});

test("OneStep listDevices uses api-key query and does not log it", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return jsonResponse(200, { devices: [] });
  };
  const res = await listDevices({
    env: { ONESTEP_API_KEY: "secret-key" },
    fetchImpl,
  });
  assert.equal(res.ok, true);
  assert.match(calls[0].url, /^https:\/\/track\.onestepgps\.com\/v3\/api\/public\/device\?api-key=/);
  assert.equal(JSON.stringify(calls[0].opts).includes("secret-key"), false);
});

test("Cloud OneStep aliases map PEM vs API key by shape", () => {
  const pem = "-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----\n";
  const resolved = resolveOneStepEnv({
    OneStepAPIKEY: pem,
    OneStepAPIKEYTobeSigned: "fleet-key-alias",
  });
  assert.equal(resolved.ONESTEP_API_KEY, "fleet-key-alias");
  assert.equal(resolved.ONESTEP_PRIVATE_KEY, pem);
  assert.equal(oneStepJwtConfigured({
    OneStepAPIKEY: pem,
    OneStepAPIKEYTobeSigned: "fleet-key-alias",
  }), true);
  assert.equal(oneStepConfigured({ OneStepAPIKEYTobeSigned: "fleet-key-alias" }), true);
});

test("protected OneStep key is wrapped in a short-lived RS256 JWT", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" });
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts });
    return jsonResponse(200, { devices: [] });
  };
  const env = { ONESTEP_API_KEY: "secret-key", ONESTEP_PRIVATE_KEY: pem };
  assert.equal(oneStepJwtConfigured(env), true);

  const token = signOneStepJwt({ apiKey: "secret-key", privateKeyPem: pem, now: 1_700_000_000_000, ttlSec: 60 });
  const [headerB64, payloadB64, sig] = token.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  assert.equal(header.alg, "RS256");
  assert.equal(payload.access_token, "secret-key");
  assert.equal(payload.exp, 1_700_000_060);
  const verify = createVerify("RSA-SHA256");
  verify.update(`${headerB64}.${payloadB64}`);
  verify.end();
  assert.equal(verify.verify(publicKey, sig, "base64url"), true);

  const res = await listDeviceInfo({ env, fetchImpl });
  assert.equal(res.ok, true);
  assert.equal(calls[0].url, "https://track.onestepgps.com/v3/api/public/device-info");
  assert.match(calls[0].opts.headers.Authorization, /^Bearer eyJ/);
  assert.equal(calls[0].url.includes("api-key"), false);
  assert.equal(JSON.stringify(calls[0]).includes("secret-key"), false);
  assert.equal(JSON.stringify(calls[0]).includes("BEGIN"), false);
});

test("oil-onestep-probe reports status and counts only", async () => {
  const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" });
  const fetchImpl = async (url) => {
    if (String(url).includes("device-info")) return jsonResponse(200, { devices: [{ id: 1 }, { id: 2 }] });
    return jsonResponse(200, { result_list: [{ id: 1 }] });
  };
  const report = await probeOneStep({
    env: { OneStepAPIKEY: pem, OneStepAPIKEYTobeSigned: "secret-key" },
    fetchImpl,
  });
  const printed = JSON.stringify(report);
  assert.equal(report.apiKey, true);
  assert.equal(report.privateKey, true);
  assert.equal(report.jwtMode, true);
  assert.equal(report.results[0].deviceCount, 2);
  assert.equal(report.results[1].status, 200);
  assert.equal(report.results[1].deviceCount, 1);
  assert.equal(report.exitCode, 0);
  assert.equal(printed.includes("secret-key"), false);
  assert.equal(printed.includes("BEGIN"), false);
});

test("eFleets has no public REST API; history export drops exception rows", () => {
  const cap = eFleetsCapability();
  assert.equal(cap.publicApi, null);
  assert.equal(cap.login, "not supported in this app");

  const rows = parseMileageHistoryExport(`Date,Odometer,Odometer Source,Exception
8/12/2026,218692,FUEL,
6/26/2026,211370,MAINTENANCE,
8/01/2026,999999,FUEL,READING ABOVE
`);
  assert.equal(rows.length, 2);
  assert.equal(pickLastOilFromHistory(rows).odometer, 211370);
  assert.equal(pickLastFuelFromHistory(rows).odometer, 218692);
});

test("integrationStatus reports booleans only", () => {
  const status = integrationStatus({
    GOOGLE_SHEETS_ACCESS_TOKEN: "tok",
    ONESTEP_API_KEY: "secret-key",
  });
  assert.equal(status.workingSheet.id, WORKING_SHEET_ID);
  assert.equal(status.workingSheet.gid, "733911326");
  assert.equal(status.sheets.configured, true);
  assert.equal(status.onestep.configured, true);
  assert.equal(status.onestep.jwt, false);
  assert.equal(status.efleets.configured, false);
  assert.equal(status.sheets.light, true);
  assert.equal(JSON.stringify(status).includes("secret-key"), false);
  assert.equal(JSON.stringify(status).includes("tok"), false);
  assert.equal(sheetsConfigured({}), false);
  assert.equal(oneStepConfigured({}), false);
});
