#!/usr/bin/env node
/**
 * Probe OneStep with env secrets. Prints counts and HTTP status only.
 * Never prints API keys, PEMs, or JWTs.
 */
import {
  listDeviceInfo,
  listDevices,
  oneStepConfigured,
  oneStepJwtConfigured,
} from "./clients/onestep.js";

function countDevices(payload) {
  if (!payload) return 0;
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload.devices)) return payload.devices.length;
  if (Array.isArray(payload.result)) return payload.result.length;
  if (Array.isArray(payload.data)) return payload.data.length;
  return payload && typeof payload === "object" ? Object.keys(payload).length : 0;
}

function summarizeBody(res) {
  const text = String(res.text || "").replace(/\s+/g, " ").slice(0, 80);
  if (!res.json) return text;
  const msg = res.json.message || res.json.error || res.json.code;
  return msg ? String(msg) : text;
}

async function probe(name, fn) {
  const res = await fn();
  return {
    path: name,
    ok: res.ok,
    status: res.status,
    deviceCount: res.ok ? countDevices(res.json) : 0,
    message: res.ok ? "ok" : summarizeBody(res),
  };
}

const jwt = oneStepJwtConfigured();
const apiKey = oneStepConfigured();
const report = {
  apiKey: apiKey,
  privateKey: Boolean(process.env.ONESTEP_PRIVATE_KEY),
  jwtMode: jwt,
};

if (!jwt) {
  console.log(JSON.stringify({
    ...report,
    error: apiKey
      ? "ONESTEP_PRIVATE_KEY missing. Protected keys need an RS256 PEM; the raw API key is not sent."
      : "ONESTEP_API_KEY and ONESTEP_PRIVATE_KEY are not set on this agent.",
  }, null, 2));
  process.exit(2);
}

const results = [];
results.push(await probe("device-info", () => listDeviceInfo()));
results.push(await probe("device", () => listDevices()));
console.log(JSON.stringify({ ...report, results }, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
