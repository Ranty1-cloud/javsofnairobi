"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES: [string, string][] = [["SUPER_ADMIN", "Super Admin"], ["ADMIN", "Administrator"], ["BOOKING_MANAGER", "Booking Manager"], ["CONTENT_EDITOR", "Content Editor"], ["FINANCE_MANAGER", "Finance Manager"], ["SUPPORT", "Customer Support"]];
const ABOUT: Record<string, string> = { SUPER_ADMIN: "Everything, including staff", ADMIN: "Trips, bookings, content, money", BOOKING_MANAGER: "Trips, bookings, boarding", CONTENT_EDITOR: "News, destinations, gallery, homepage photo", FINANCE_MANAGER: "Payments, refunds, promo codes", SUPPORT: "Look up bookings, check people in" };
type S = { email: string; name: string; role: string; since: string };

export default function StaffManager({ staff, me }: { staff: S[]; me: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(method: "POST" | "PATCH", body: object, done: string) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/staff", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg({ ok: false, text: typeof j.error === "string" ? j.error : "Something went wrong" }); return false; }
    setMsg({ ok: true, text: done }); router.refresh(); return true;
  }
  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget, f = new FormData(form);
    if (await call("POST", { email: f.get("email"), name: f.get("name"), role: f.get("role") }, "Invite sent. They set their password from the email link.")) form.reset();
  }
  async function setRole(s: S, role: string) {
    const demote = role === "CUSTOMER";
    if (demote && !confirm(`Remove staff access for ${s.name}? They keep a normal customer account.`)) return;
    await call("PATCH", { email: s.email, role }, demote ? "Access removed." : "Role updated.");
  }

  return (
    <div className="adm-grid g-2-1" style={{ alignItems: "start" }}>
      <section className="panel">
        <div className="panel-head"><h2>Team</h2><span className="mut">{staff.length} with access</span></div>
        <table className="tbl"><thead><tr><th>Person</th><th>Role</th><th /></tr></thead><tbody>
          {staff.map(s => {
            const self = s.email === me;
            return (
              <tr key={s.email}>
                <td><b>{s.name}</b>{self && <span className="badge red" style={{ marginLeft: 8 }}>You</span>}<br /><small className="mut">{s.email}</small></td>
                <td><select aria-label={`Role for ${s.name}`} value={s.role} disabled={self || busy} onChange={e => setRole(s, e.target.value)} style={{ margin: 0 }}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><br /><small className="mut">{ABOUT[s.role]}</small></td>
                <td style={{ textAlign: "right" }}>{!self && <button className="btn ghost sm" disabled={busy} onClick={() => setRole(s, "CUSTOMER")}>Remove</button>}</td>
              </tr>
            );
          })}
        </tbody></table>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>Invite someone</h2></div>
        <form onSubmit={invite} className="stack">
          <input name="name" placeholder="Full name" required minLength={2} maxLength={80} />
          <input name="email" type="email" placeholder="Email" required maxLength={160} />
          <select name="role" defaultValue="BOOKING_MANAGER" aria-label="Role">{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send invite"}</button>
        </form>
        <p className="note" style={{ marginTop: 12 }}>Only give people the access their job needs. You cannot change your own role.</p>
        {msg && <p role="status" style={{ margin: "10px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
    </div>
  );
}
