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
  resolveOneStepEnv,
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

export async function probeOneStep({ env = process.env, fetchImpl = fetch } = {}) {
  const resolved = resolveOneStepEnv(env);
  const jwt = oneStepJwtConfigured(resolved);
  const apiKey = oneStepConfigured(resolved);
  const report = {
    apiKey,
    privateKey: Boolean(resolved.ONESTEP_PRIVATE_KEY),
    jwtMode: jwt,
    aliases: {
      OneStepAPIKEY: Boolean(env.OneStepAPIKEY),
      OneStepAPIKEYTobeSigned: Boolean(env.OneStepAPIKEYTobeSigned),
    },
  };

  if (!jwt) {
    return {
      ...report,
      error: apiKey
        ? "ONESTEP_PRIVATE_KEY missing. Protected keys need an RS256 PEM; the raw API key is not sent."
        : "ONESTEP_API_KEY and ONESTEP_PRIVATE_KEY are not set on this agent.",
      results: [],
      exitCode: 2,
    };
  }

  const results = [];
  for (const [name, fn] of [
    ["device-info", listDeviceInfo],
    ["device", listDevices],
  ]) {
    const res = await fn({ env: resolved, fetchImpl });
    results.push({
      path: name,
      ok: res.ok,
      status: res.status,
      deviceCount: res.ok ? countDevices(res.json) : 0,
      message: res.ok ? "ok" : summarizeBody(res),
    });
  }

  return {
    ...report,
    results,
    exitCode: results.every((r) => r.ok) ? 0 : 1,
  };
}

async function main() {
  const report = await probeOneStep();
  console.log(JSON.stringify({
    apiKey: report.apiKey,
    privateKey: report.privateKey,
    jwtMode: report.jwtMode,
    aliases: report.aliases,
    ...(report.error ? { error: report.error } : {}),
    ...(report.results.length ? { results: report.results } : {}),
  }, null, 2));
  process.exit(report.exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
