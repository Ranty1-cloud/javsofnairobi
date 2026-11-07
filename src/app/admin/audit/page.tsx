import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
export const metadata = { title: "Audit log", robots: { index: false } };
export const dynamic = "force-dynamic";
const PAGE = 40;

export default async function Audit({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) redirect("/admin");
  const q = (searchParams.q ?? "").trim().slice(0, 60), page = Math.max(1, Math.floor(Number(searchParams.page)) || 1);
  const where = q ? { action: { contains: q, mode: "insensitive" as const } } : {};
  const [rows, total] = await Promise.all([db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }), db.auditLog.count({ where })]);
  const ids = [...new Set(rows.map(r => r.actor).filter((x): x is string => !!x))];
  const people: { id: string; name: string; role: string }[] = ids.length ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, role: true } }) : [];
  const who = new Map(people.map(p => [p.id, p]));
  const pages = Math.max(1, Math.ceil(total / PAGE)), href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;
  return (
    <main className="adm-page">
      <header className="adm-head">
        <div><p className="eyebrow">Security</p><h1>Audit <span className="red">log</span></h1><p className="mut" style={{ margin: 0 }}>Who did what, newest first. Entries cannot be edited from the app.</p></div>
        <form className="adm-tools" action="/admin/audit"><input name="q" defaultValue={q} placeholder="Filter, e.g. refund, staff, trip" aria-label="Filter by action" style={{ margin: 0, minWidth: 220 }} /><button className="btn sm">Filter</button></form>
      </header>
      <section className="panel">
        {rows.length ? <table className="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead><tbody>
          {rows.map(r => { const p = r.actor ? who.get(r.actor) : null; return (
            <tr key={r.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</td><td>{p ? <>{p.name}<br /><small className="mut">{p.role.replace("_", " ").toLowerCase()}</small></> : <span className="mut">{r.actor ? "Removed account" : "System"}</span>}</td><td><code>{r.action}</code></td><td><small className="mut" style={{ wordBreak: "break-word" }}>{r.detail ? JSON.stringify(r.detail).slice(0, 160) : ""}</small></td></tr>
          ); })}
        </tbody></table> : <p className="mut">{q ? "Nothing matches that filter." : "No activity recorded yet."}</p>}
        {pages > 1 && <div className="adm-actions" style={{ justifyContent: "space-between", marginTop: 14 }}>
          {page > 1 ? <Link className="btn ghost sm" href={href(page - 1)}>← Newer</Link> : <span />}<span className="mut">Page {page} of {pages}</span>{page < pages ? <Link className="btn ghost sm" href={href(page + 1)}>Older →</Link> : <span />}
        </div>}
      </section>
    </main>
  );
}
