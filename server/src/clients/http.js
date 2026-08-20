/**
 * Tiny fetch wrapper. No extra packages.
 * Tokens are sent, never logged.
 */
export async function requestJson(url, { method = "GET", headers = {}, body, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, {
    method,
    headers,
    body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { ok: res.ok, status: res.status, json, text };
}

export function queryString(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    usp.set(key, String(value));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}
