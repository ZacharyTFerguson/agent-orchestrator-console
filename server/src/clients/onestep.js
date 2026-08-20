/**
 * Light OneStepGPS v3 public API client.
 *
 * Hosted docs are behind the signed-in portal. Sourced endpoints only:
 *   GET /v3/api/public/device              — device list (public forum + GrokBot research)
 *   GET /v3/api/public/route/drive-stop    — miles since a timestamp (official apidoc; this account may 403)
 *   GET /v3/api/public/report-generated/export/:id — generated report file
 *
 * Auth: api-key query param (public API) or Bearer JWT.
 * Never treat OneStep odometer as Last Reading. Distance since T only.
 */
import { queryString, requestJson } from "./http.js";

export const ONESTEP_HOST = "https://track.onestepgps.com";
export const ONESTEP_PATHS = {
  device: "/v3/api/public/device",
  driveStop: "/v3/api/public/route/drive-stop",
  reportExport: "/v3/api/public/report-generated/export",
};

const ODOMETER_KEYS = new Set(["odometer", "odo", "mileage", "calculated_mileage"]);
const DISTANCE_KEYS = ["distance_miles", "miles_driven", "distance", "total_distance", "drive_distance"];

export function oneStepConfigured(env = process.env) {
  return Boolean(env.ONESTEP_API_KEY);
}

function authQuery(env = process.env, extra = {}) {
  return { "api-key": env.ONESTEP_API_KEY, ...extra };
}

function authHeaders(env = process.env) {
  if (env.ONESTEP_BEARER_TOKEN) return { Authorization: `Bearer ${env.ONESTEP_BEARER_TOKEN}` };
  return {};
}

export async function oneStepGet(path, query, { env = process.env, fetchImpl = fetch } = {}) {
  const url = `${ONESTEP_HOST}${path}${queryString(authQuery(env, query))}`;
  return requestJson(url, { headers: authHeaders(env), fetchImpl });
}

export function listDevices(opts) {
  return oneStepGet(ONESTEP_PATHS.device, {}, opts);
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
