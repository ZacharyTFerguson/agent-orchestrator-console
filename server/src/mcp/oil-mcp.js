/**
 * Light stdio MCP for oil-change integrations.
 * JSON-RPC 2.0 with Content-Length framing. No extra packages.
 * Tokens are read from env and never written to stdout/stderr.
 */
import { integrationStatus } from "../clients/index.js";
import { getSheetValues, updateSheetValues, sheetsConfigured } from "../clients/sheets.js";
import {
  composeLastReading,
  driveStopMiles,
  extractDistance,
  listDevices,
  oneStepConfigured,
} from "../clients/onestep.js";
import { eFleetsCapability } from "../clients/efleets.js";
import { runOilDueListJob } from "../oil-change-job.js";
import { ORIGINAL_TEMPLATE_ID, resolveWorkingSheet } from "../oil-changes.js";

export const SERVER_INFO = { name: "oil-fleet", version: "0.1.0" };
export const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "oil_status",
    description:
      "Configured flags for Sheets, OneStep, and eFleets. Never returns tokens. eFleets has no public REST API.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "oil_due_list",
    description:
      "Build the CHANGE OIL AFTER 5K due-list from Sheets (if a token is set) or the CSV export. Same GrokBot rules: skip backward odometers and jumps over 30,000 miles.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "sheets_get_values",
    description:
      "Google Sheets API v4 values.get on the working Automations sheet by default. Requires GOOGLE_SHEETS_ACCESS_TOKEN or GOOGLE_SHEETS_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        range: { type: "string", description: "A1 range, e.g. 'eFleets All Cars sorted'!A1:T" },
      },
      required: ["range"],
      additionalProperties: false,
    },
  },
  {
    name: "sheets_update_values",
    description:
      "Google Sheets API v4 values.update. Refuses the original PDI template and formula columns I/J. Requires GOOGLE_SHEETS_ACCESS_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        spreadsheetId: { type: "string" },
        range: { type: "string" },
        values: {
          type: "array",
          items: { type: "array", items: { type: ["string", "number", "null"] } },
        },
      },
      required: ["range", "values"],
      additionalProperties: false,
    },
  },
  {
    name: "onestep_devices",
    description: "OneStep GET /v3/api/public/device. Requires ONESTEP_API_KEY. Do not treat odometer as Last Reading.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "onestep_miles_since",
    description:
      "OneStep drive-stop miles since a timestamp, then extract distance only (rejects odometer fields). Requires ONESTEP_API_KEY.",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string" },
        begin: { type: "string", description: "ISO timestamp T for miles since T" },
        end: { type: "string" },
      },
      additionalProperties: true,
    },
  },
  {
    name: "compose_last_reading",
    description:
      "Last Reading = Enterprise odometer at a known second + OneStep miles since that second. Never uses OneStep odometer.",
    inputSchema: {
      type: "object",
      properties: {
        enterpriseOdo: { type: "number" },
        oneStepMiles: { type: "number" },
      },
      required: ["enterpriseOdo", "oneStepMiles"],
      additionalProperties: false,
    },
  },
];

export function listTools() {
  return TOOLS;
}

function textResult(obj, isError = false) {
  return {
    content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }],
    isError,
  };
}

export async function callTool(name, args = {}, { env = process.env, fetchImpl = fetch } = {}) {
  try {
    return await invokeTool(name, args, { env, fetchImpl });
  } catch (err) {
    return textResult({ error: err.message }, true);
  }
}

async function invokeTool(name, args, { env, fetchImpl }) {
  switch (name) {
    case "oil_status":
      return textResult({
        ...integrationStatus(env),
        workingSheet: resolveWorkingSheet(env),
        originalTemplateId: ORIGINAL_TEMPLATE_ID,
        efleets: { ...eFleetsCapability(), configured: false },
      });
    case "oil_due_list": {
      const result = await runOilDueListJob({ env, fetchImpl });
      return textResult({
        sourcePath: result.sourcePath,
        summary: result.summary,
        review: result.review,
        counts: result.counts,
        report: result.report,
      });
    }
    case "sheets_get_values": {
      if (!sheetsConfigured(env)) {
        return textResult({ error: "Sheets not configured. Set GOOGLE_SHEETS_ACCESS_TOKEN or GOOGLE_SHEETS_API_KEY." }, true);
      }
      const res = await getSheetValues({
        spreadsheetId: args.spreadsheetId || resolveWorkingSheet(env).id,
        range: args.range,
        env,
        fetchImpl,
      });
      return textResult({ ok: res.ok, status: res.status, values: res.json?.values ?? [] }, !res.ok);
    }
    case "sheets_update_values": {
      const res = await updateSheetValues({
        spreadsheetId: args.spreadsheetId || resolveWorkingSheet(env).id,
        range: args.range,
        values: args.values,
        env,
        fetchImpl,
      });
      return textResult({ ok: res.ok, status: res.status, updated: res.json }, !res.ok);
    }
    case "onestep_devices": {
      if (!oneStepConfigured(env)) {
        return textResult({ error: "OneStep not configured. Set ONESTEP_API_KEY." }, true);
      }
      const res = await listDevices({ env, fetchImpl });
      return textResult({ ok: res.ok, status: res.status, json: res.json }, !res.ok);
    }
    case "onestep_miles_since": {
      if (!oneStepConfigured(env)) {
        return textResult({ error: "OneStep not configured. Set ONESTEP_API_KEY." }, true);
      }
      const res = await driveStopMiles(args, { env, fetchImpl });
      const distance = extractDistance(res.json);
      return textResult({ ok: res.ok, status: res.status, distance }, !res.ok);
    }
    case "compose_last_reading":
      return textResult(composeLastReading(args));
    default:
      return textResult({ error: `Unknown tool: ${name}` }, true);
  }
}

export async function handleMessage(msg, ctx) {
  if (!msg || typeof msg !== "object") return null;
  if (msg.method && String(msg.method).startsWith("notifications/")) return null;

  if (msg.method === "initialize") {
    const version = msg.params?.protocolVersion || PROTOCOL_VERSION;
    return {
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: version,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (msg.method === "ping") {
    return { jsonrpc: "2.0", id: msg.id, result: {} };
  }

  if (msg.method === "tools/list") {
    return { jsonrpc: "2.0", id: msg.id, result: { tools: listTools() } };
  }

  if (msg.method === "tools/call") {
    try {
      const result = await callTool(msg.params?.name, msg.params?.arguments ?? {}, ctx);
      return { jsonrpc: "2.0", id: msg.id, result };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: msg.id,
        result: textResult({ error: err.message }, true),
      };
    }
  }

  if (msg.id == null) return null;
  return {
    jsonrpc: "2.0",
    id: msg.id,
    error: { code: -32601, message: `Method not found: ${msg.method}` },
  };
}

export function encodeMessage(obj) {
  const json = JSON.stringify(obj);
  const body = Buffer.from(json, "utf8");
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "utf8"), body]);
}

export function createFramer(onMessage) {
  let buf = Buffer.alloc(0);
  let chain = Promise.resolve();
  return (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (true) {
      const headerEnd = buf.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buf.subarray(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        buf = buf.subarray(headerEnd + 4);
        continue;
      }
      const len = Number(match[1]);
      const start = headerEnd + 4;
      if (buf.length < start + len) break;
      const body = buf.subarray(start, start + len).toString("utf8");
      buf = buf.subarray(start + len);
      const msg = JSON.parse(body);
      chain = chain.then(() => onMessage(msg));
    }
  };
}

export function sanitizeMcpEnv(env = process.env) {
  const out = { ...env };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string" && /\$\{env:[^}]+\}/.test(value)) delete out[key];
  }
  return out;
}

export async function startStdio({ env = process.env, fetchImpl = fetch, stdin = process.stdin, stdout = process.stdout } = {}) {
  const cleanEnv = sanitizeMcpEnv(env);
  const write = (obj) => {
    stdout.write(encodeMessage(obj));
  };
  const onChunk = createFramer(async (msg) => {
    const reply = await handleMessage(msg, { env: cleanEnv, fetchImpl });
    if (reply) write(reply);
  });
  stdin.on("data", onChunk);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startStdio();
}
