/**
 * Light eFleets adapter.
 *
 * Enterprise Fleet Management does not publish a customer REST API.
 * The official light path is the Client Portal export (CSV / XLSX), not Chrome.
 *
 * Portal: https://login.efleets.com/fleetweb  (company 583424)
 * Ask the Client Strategy Manager if a partner feed exists; do not scrape login.
 * Never type or store eFleets passwords.
 */
import { parseFleetCsv } from "../oil-changes.js";

export const EFLEETS_PUBLIC_API = null;
export const EFLEETS_PORTAL = "https://login.efleets.com/fleetweb";
export const EFLEETS_COMPANY_ID = "583424";

export function eFleetsConfigured() {
  return false;
}

export function eFleetsCapability() {
  return {
    publicApi: EFLEETS_PUBLIC_API,
    portal: EFLEETS_PORTAL,
    companyId: EFLEETS_COMPANY_ID,
    lightPath: "portal CSV/XLSX export → parseFleetCsv / parseMileageHistoryExport",
    login: "not supported in this app",
  };
}

/**
 * Mileage History / Fuel export: Date, Odometer, Odometer Source, Exception.
 * Shop (MAINTENANCE) vs fuel (FUEL). Backward and exception rows are dropped.
 */
export function parseMileageHistoryExport(csvText) {
  const lines = String(csvText)
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dateIdx = header.findIndex((h) => h === "date");
  const odoIdx = header.findIndex((h) => h.includes("odometer") && !h.includes("source"));
  const sourceIdx = header.findIndex((h) => h.includes("source"));
  const exceptionIdx = header.findIndex((h) => h.includes("exception"));

  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim());
    const odometer = Number(String(cols[odoIdx] ?? "").replace(/,/g, ""));
    const exception = (cols[exceptionIdx] ?? "").toUpperCase();
    if (!Number.isFinite(odometer)) continue;
    if (exception.includes("READING ABOVE") || exception.includes("READING OUT")) continue;
    rows.push({
      date: cols[dateIdx] ?? "",
      odometer,
      source: (cols[sourceIdx] ?? "").toUpperCase(),
      exception,
    });
  }
  return rows;
}

export function pickLastOilFromHistory(rows) {
  const shop = rows.filter((r) => r.source === "MAINTENANCE");
  return shop[0] || null;
}

export function pickLastFuelFromHistory(rows) {
  const fuel = rows.filter((r) => r.source === "FUEL");
  return fuel[0] || null;
}

export function parseEfleetsFleetCsv(csvText) {
  return parseFleetCsv(csvText);
}
