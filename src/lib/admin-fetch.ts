export type Reply = { error?: unknown; [k: string]: unknown };
export type Msg = { ok: boolean; text: string } | null;
export async function api(url: string, method: string, body?: object): Promise<{ ok: boolean; j: Reply }> {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}
export const errText = (j: Reply, fallback: string) => (typeof j.error === "string" ? j.error : fallback);
// datetime-local has no timezone. Nairobi is UTC+3 all year, so convert explicitly instead of trusting the browser.
export const toNairobiInput = (iso: string) => new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16);
export const fromNairobiInput = (v: string) => new Date(`${v}:00+03:00`).toISOString();
