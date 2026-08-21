/**
 * Light OneStepGPS v3 public API client.
 *
 * Hosted docs are behind the signed-in portal. Sourced endpoints only:
 *   GET /v3/api/public/device              — device list
 *   GET /v3/api/public/device-info         — current device-info (JWT example)
 *   GET /v3/api/public/route/drive-stop    — miles since a timestamp (this account may 403)
 *   GET /v3/api/public/report-generated/export/:id — generated report file
 *
 * Protected keys: do not send the API key as-is. Wrap it in a short-lived
 * RS256 JWT (access_token + exp ≤ 5 minutes) signed with ONESTEP_PRIVATE_KEY,
 * then send Authorization: Bearer <signed-token>. Fresh token per request.
 * Legacy unprotected keys may still use the api-key query param.
 *
 * Cloud secret aliases (shape-detected, never logged):
 *   OneStepAPIKEYTobeSigned / OneStepAPIKEY
 *
 * Never treat OneStep odometer as Last Reading. Distance since T only.
 */
import { createSign } from "node:crypto";
import { queryString, requestJson } from "./http.js";

export const ONESTEP_HOST = "https://track.onestepgps.com";
export const ONESTEP_PATHS = {
  device: "/v3/api/public/device",
  deviceInfo: "/v3/api/public/device-info",
  driveStop: "/v3/api/public/route/drive-stop",
  reportExport: "/v3/api/public/report-generated/export",
};

const ODOMETER_KEYS = new Set(["odometer", "odo", "mileage", "calculated_mileage"]);
const DISTANCE_KEYS = ["distance_miles", "miles_driven", "distance", "total_distance", "drive_distance"];
const MAX_JWT_TTL_SEC = 300;
const SECRET_ALIASES = ["ONESTEP_API_KEY", "ONESTEP_PRIVATE_KEY", "OneStepAPIKEY", "OneStepAPIKEYTobeSigned"];

export function normalizePem(value) {
  if (value == null) return "";
  let pem = String(value).trim();
  if (!pem) return "";
  if (pem.includes("\\n") && !pem.includes("\n")) pem = pem.replace(/\\n/g, "\n");
  return pem;
}

export function looksLikePrivateKeyPem(value) {
  return /BEGIN [A-Z ]*PRIVATE KEY/.test(normalizePem(value));
}

/**
 * Map Cloud secret names onto ONESTEP_API_KEY / ONESTEP_PRIVATE_KEY.
 * Canonical names win. Aliases are classified by PEM shape, not by label.
 */
export function resolveOneStepEnv(env = process.env) {
  const out = { ...env };
  const candidates = SECRET_ALIASES.map((name) => env[name]).filter((value) => value != null && String(value).trim());

  if (!out.ONESTEP_PRIVATE_KEY) {
    const pem = candidates.find((value) => looksLikePrivateKeyPem(value));
    if (pem) out.ONESTEP_PRIVATE_KEY = pem;
  }
  if (!out.ONESTEP_API_KEY) {
    const key = candidates.find((value) => !looksLikePrivateKeyPem(value));
    if (key) out.ONESTEP_API_KEY = key;
  }
  return out;
}

export function oneStepConfigured(env = process.env) {
  return Boolean(resolveOneStepEnv(env).ONESTEP_API_KEY);
}

export function oneStepJwtConfigured(env = process.env) {
  const resolved = resolveOneStepEnv(env);
  return Boolean(resolved.ONESTEP_API_KEY && resolved.ONESTEP_PRIVATE_KEY);
}

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");
}

/**
 * Sign a fresh OneStep JWT. Does not log the API key or the token.
 */
export function signOneStepJwt({ apiKey, privateKeyPem, now = Date.now(), ttlSec = 60 } = {}) {
  if (!apiKey) throw new Error("ONESTEP_API_KEY is required to sign a JWT");
  const pem = normalizePem(privateKeyPem);
  if (!pem.includes("PRIVATE KEY")) throw new Error("ONESTEP_PRIVATE_KEY must be an RSA PEM");
  if (ttlSec <= 0 || ttlSec > MAX_JWT_TTL_SEC) {
    throw new Error("OneStep JWT exp must be between 1 and 300 seconds");
  }
  const header = base64urlJson({ alg: "RS256", typ: "JWT" });
  const payload = base64urlJson({
    access_token: apiKey,
    exp: Math.floor(now / 1000) + ttlSec,
  });
  const data = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  sign.end();
  return `${data}.${sign.sign(pem, "base64url")}`;
}

function authForRequest(env = process.env, extra = {}) {
  const resolved = resolveOneStepEnv(env);
  if (oneStepJwtConfigured(resolved)) {
    const signed = signOneStepJwt({
      apiKey: resolved.ONESTEP_API_KEY,
      privateKeyPem: resolved.ONESTEP_PRIVATE_KEY,
    });
    return { headers: { Authorization: `Bearer ${signed}` }, query: extra };
  }
  const headers = resolved.ONESTEP_BEARER_TOKEN
    ? { Authorization: `Bearer ${resolved.ONESTEP_BEARER_TOKEN}` }
    : {};
  return { headers, query: { "api-key": resolved.ONESTEP_API_KEY, ...extra } };
}

export async function oneStepGet(path, query, { env = process.env, fetchImpl = fetch } = {}) {
  const auth = authForRequest(env, query);
  const url = `${ONESTEP_HOST}${path}${queryString(auth.query)}`;
  return requestJson(url, { headers: auth.headers, fetchImpl });
}

export function listDevices(opts) {
  return oneStepGet(ONESTEP_PATHS.device, {}, opts);
}

export function listDeviceInfo(opts) {
  return oneStepGet(ONESTEP_PATHS.deviceInfo, {}, opts);
}

export function driveStopMiles(query, opts) {
  return oneStepGet(ONESTEP_PATHS.driveStop, query, opts);
}

export function exportGeneratedReport(reportId, opts) {
  return oneStepGet(`${ONESTEP_PATHS.reportExport}/${reportId}`, {}, opts);
}

export function extractDistance(payload) {
  if (payload == null) return { miles: null, sourceField: null, rejectedOdometer: false };
  const stack = [payload];
  let rejectedOdometer = false;
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;
    if (Array.isArray(cur)) {
      for (const item of cur) stack.push(item);
      continue;
    }
    for (const key of DISTANCE_KEYS) {
      if (cur[key] != null && Number.isFinite(Number(cur[key]))) {
        return { miles: Number(cur[key]), sourceField: key, rejectedOdometer };
      }
    }
    for (const [key, value] of Object.entries(cur)) {
      if (ODOMETER_KEYS.has(key.toLowerCase()) && value != null) rejectedOdometer = true;
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return { miles: null, sourceField: null, rejectedOdometer };
}

/**
 * Last Reading = Enterprise odo at a known second + OneStep distance since that second.
 * OneStep's own odometer is never used.
 */
export function composeLastReading({ enterpriseOdo, oneStepMiles }) {
  if (enterpriseOdo == null) return { skip: true, reason: "NO_ENTERPRISE_ODO" };
  if (oneStepMiles == null) return { skip: true, reason: "NO_ONESTEP" };
  return {
    skip: false,
    lastReading: enterpriseOdo + oneStepMiles,
    method: "MD40_METHOD",
  };
}
