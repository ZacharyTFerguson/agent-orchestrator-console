/**
 * Light Google Sheets API v4 client (official REST, no googleapis package).
 *
 * GET  https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}
 * PUT  https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}?valueInputOption=USER_ENTERED
 *
 * Auth: Bearer access token, or API key for public read-only sheets.
 * Never write oil-sheet formula columns I or J.
 */
import { queryString, requestJson } from "./http.js";
import { ORIGINAL_TEMPLATE_ID, WORKING_SHEET_ID } from "../oil-changes.js";

export const SHEETS_API = "https://sheets.googleapis.com/v4";
export const SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export function sheetsConfigured(env = process.env) {
  return Boolean(env.GOOGLE_SHEETS_ACCESS_TOKEN || env.GOOGLE_SHEETS_API_KEY);
}

function authHeaders(env = process.env) {
  const token = env.GOOGLE_SHEETS_ACCESS_TOKEN;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function encodeRange(range) {
  return encodeURIComponent(range);
}

export function assertWritableOilRange(spreadsheetId, range) {
  if (spreadsheetId === ORIGINAL_TEMPLATE_ID) {
    throw new Error("Refusing write to the original PDI oil-change template");
  }
  const upper = String(range).toUpperCase();
  if (/(^|!|:)[IJ](\d|$|:)/.test(upper) || /[IJ]:[IJ]/.test(upper)) {
    throw new Error(`Refusing write to formula columns I/J: ${range}`);
  }
}

export async function getSheetValues({
  spreadsheetId = WORKING_SHEET_ID,
  range,
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  if (!range) throw new Error("Sheets get requires a range");
  const key = env.GOOGLE_SHEETS_API_KEY;
  const url =
    `${SHEETS_API}/spreadsheets/${spreadsheetId}/values/${encodeRange(range)}` +
    queryString({
      key,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
  return requestJson(url, { headers: authHeaders(env), fetchImpl });
}

export async function updateSheetValues({
  spreadsheetId = WORKING_SHEET_ID,
  range,
  values,
  env = process.env,
  fetchImpl = fetch,
} = {}) {
  if (!range) throw new Error("Sheets update requires a range");
  if (!env.GOOGLE_SHEETS_ACCESS_TOKEN) {
    throw new Error("GOOGLE_SHEETS_ACCESS_TOKEN is required to write cells");
  }
  assertWritableOilRange(spreadsheetId, range);
  const url =
    `${SHEETS_API}/spreadsheets/${spreadsheetId}/values/${encodeRange(range)}` +
    queryString({ valueInputOption: "USER_ENTERED" });
  return requestJson(url, {
    method: "PUT",
    headers: { ...authHeaders(env), "Content-Type": "application/json" },
    body: { range, majorDimension: "ROWS", values },
    fetchImpl,
  });
}

export function valuesToCsv(values = []) {
  return values
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(",")
    )
    .join("\n");
}
