"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export type Promo = { id: string; code: string; percentOff: number; used: number; maxUses: number; expiresAt: string | null; active: boolean };

export default function PromoManager({ promos }: { promos: Promo[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null), [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    const body: Record<string, unknown> = { code: f.get("code"), percentOff: Number(f.get("percentOff")), maxUses: Number(f.get("maxUses")) };
    if (f.get("expiresAt")) body.expiresAt = new Date(`${f.get("expiresAt")}T23:59:59+03:00`).toISOString();
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/promo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: typeof j.error === "string" ? j.error : "Check the fields and try again" });
    setMsg({ ok: true, text: `${j.code} created.` }); form.reset(); router.refresh();
  }
  async function toggle(p: Promo) {
    const r = await fetch("/api/admin/promo", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id, active: !p.active }) });
    if (!r.ok) setMsg({ ok: false, text: "Could not update that code" });
    router.refresh();
  }
  const now = Date.now();
  return (
    <div className="adm-grid g-2-1" style={{ alignItems: "start" }}>
      <section className="panel">
        <div className="panel-head"><h2>Codes</h2><span className="mut">{promos.filter(p => p.active).length} active</span></div>
        {promos.length ? <table className="tbl"><thead><tr><th>Code</th><th>Off</th><th>Used</th><th>Expires</th><th /></tr></thead><tbody>
          {promos.map(p => { const dead = !!p.expiresAt && new Date(p.expiresAt).getTime() < now, full = p.used >= p.maxUses; return (
            <tr key={p.id}>
              <td><b>{p.code}</b>{(dead || full) && <small className="mut" style={{ display: "block" }}>{dead ? "Expired" : "Fully used"}</small>}</td>
              <td>{p.percentOff}%</td><td>{p.used}/{p.maxUses}</td>
              <td>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" }) : "Never"}</td>
              <td style={{ textAlign: "right" }}><button className={`btn sm${p.active ? " ghost" : ""}`} onClick={() => toggle(p)}>{p.active ? "Turn off" : "Turn on"}</button></td>
            </tr>
          ); })}
        </tbody></table> : <p className="mut">No codes yet. Create your first one.</p>}
      </section>
      <section className="panel">
        <div className="panel-head"><h2>New code</h2></div>
        <form onSubmit={create} className="stack">
          <input name="code" placeholder="CODE, e.g. SZN2" required minLength={3} maxLength={30} style={{ textTransform: "uppercase" }} />
          <input name="percentOff" type="number" min={1} max={90} placeholder="Percent off (1 to 90)" required />
          <input name="maxUses" type="number" min={1} placeholder="Maximum uses" required />
          <label className="mut" style={{ fontSize: ".8rem" }}>Last day valid (optional)</label>
          <input name="expiresAt" type="date" />
          <button className="btn" disabled={busy}>{busy ? "Creating…" : "Create code"}</button>
        </form>
        {msg && <p role="status" style={{ margin: "10px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
    </div>
  );
}
