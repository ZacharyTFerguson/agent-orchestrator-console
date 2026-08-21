import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SERVER_INFO,
  callTool,
  createFramer,
  encodeMessage,
  handleMessage,
  listTools,
  sanitizeMcpEnv,
} from "../src/mcp/oil-mcp.js";
import { ORIGINAL_TEMPLATE_ID, WORKING_SHEET_ID } from "../src/oil-changes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_BIN = resolve(__dirname, "../src/mcp/oil-mcp.js");

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

test("tools/list names the light oil-fleet tools", async () => {
  const reply = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  const names = reply.result.tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "compose_last_reading",
    "oil_due_list",
    "oil_status",
    "onestep_devices",
    "onestep_miles_since",
    "sheets_get_values",
    "sheets_update_values",
  ]);
  assert.equal(listTools().length, 7);
});

test("initialize returns serverInfo without secrets", async () => {
  const reply = await handleMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2024-11-05" },
  });
  assert.equal(reply.result.serverInfo.name, SERVER_INFO.name);
  assert.equal(JSON.stringify(reply).includes("TOKEN"), false);
});

test("oil_status reports booleans only", async () => {
  const result = await callTool("oil_status", {}, {
    env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok", ONESTEP_API_KEY: "secret-key" },
  });
  const body = JSON.parse(result.content[0].text);
  assert.equal(body.sheets.configured, true);
  assert.equal(body.onestep.configured, true);
  assert.equal(body.efleets.publicApi, null);
  assert.equal(result.content[0].text.includes("secret-key"), false);
  assert.equal(result.content[0].text.includes("tok"), false);
});

test("sheets_update_values refuses the original template via MCP", async () => {
  const result = await callTool(
    "sheets_update_values",
    { spreadsheetId: ORIGINAL_TEMPLATE_ID, range: "K2", values: [["1"]] },
    { env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" } }
  );
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /original PDI/);
});

test("sheets_get_values uses mocked fetch", async () => {
  const fetchImpl = async () => jsonResponse(200, { values: [["Vehicle"], ["UNIT-A"]] });
  const result = await callTool(
    "sheets_get_values",
    { spreadsheetId: WORKING_SHEET_ID, range: "A1:A" },
    { env: { GOOGLE_SHEETS_ACCESS_TOKEN: "tok" }, fetchImpl }
  );
  assert.equal(result.isError, false);
  assert.match(result.content[0].text, /UNIT-A/);
});

test("compose_last_reading stays MD-40", async () => {
  const result = await callTool("compose_last_reading", { enterpriseOdo: 1000, oneStepMiles: 12 });
  assert.match(result.content[0].text, /MD40_METHOD/);
  assert.match(result.content[0].text, /1012/);
});

test("unset ${env:NAME} placeholders are not treated as tokens", () => {
  const clean = sanitizeMcpEnv({
    GOOGLE_SHEETS_ACCESS_TOKEN: "${env:GOOGLE_SHEETS_ACCESS_TOKEN}",
    ONESTEP_API_KEY: "real",
  });
  assert.equal(clean.GOOGLE_SHEETS_ACCESS_TOKEN, undefined);
  assert.equal(clean.ONESTEP_API_KEY, "real");
});

test("stdio process speaks Content-Length JSON-RPC", async () => {
  const child = spawn(process.execPath, [MCP_BIN], { stdio: ["pipe", "pipe", "pipe"] });
  const replies = [];
  const onChunk = createFramer((msg) => replies.push(msg));
  child.stdout.on("data", onChunk);

  child.stdin.write(
    encodeMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } })
  );
  child.stdin.write(encodeMessage({ jsonrpc: "2.0", method: "notifications/initialized" }));
  child.stdin.write(encodeMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }));

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("MCP stdio timed out")), 4000);
    const check = setInterval(() => {
      if (replies.length >= 2) {
        clearInterval(check);
        clearTimeout(t);
        resolve();
      }
    }, 25);
  });

  child.kill("SIGTERM");
  assert.equal(replies[0].result.serverInfo.name, "oil-fleet");
  assert.ok(replies[1].result.tools.some((t) => t.name === "oil_due_list"));
});
