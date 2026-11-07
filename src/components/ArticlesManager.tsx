"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import { ARTICLE_CATS } from "@/lib/content";
import { api, errText, type Msg } from "@/lib/admin-fetch";

export type ArticleRow = { id: string; slug: string; title: string; category: string; excerpt: string; body: string; coverUrl: string | null; author: string; publishedAt: string | null; comments: number };
const when = (iso: string) => new Date(iso).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" });

function ArticleForm({ a, onDone }: { a?: ArticleRow; onDone: (m: Msg) => void }) {
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), s = (k: string) => String(f.get(k) ?? "").trim();
    const body: Record<string, unknown> = { title: s("title"), category: s("category"), excerpt: s("excerpt"), body: s("body"), coverUrl: s("coverUrl") || null };
    if (s("author")) body.author = s("author");
    if (a) body.id = a.id; else body.publish = f.get("publish") === "on";
    setBusy(true);
    const { ok, j } = await api("/api/admin/articles", a ? "PATCH" : "POST", body);
    setBusy(false);
    onDone(ok ? { ok: true, text: a ? "Story saved." : body.publish ? "Story published. It is live on the News page." : "Draft saved. Publish it when it is ready." } : { ok: false, text: errText(j, "Could not save the story.") });
  }
  return (
    <form onSubmit={go} className="ev-edit stack">
      <div className="ev-cols">
        <div className="stack">
          <label>Headline</label><input name="title" defaultValue={a?.title} required minLength={3} maxLength={140} />
          <label>Category</label><select name="category" defaultValue={a?.category ?? ARTICLE_CATS[0]}>{ARTICLE_CATS.map(c => <option key={c}>{c}</option>)}</select>
          <label>Summary <span className="mut">(shown on cards)</span></label><textarea name="excerpt" defaultValue={a?.excerpt} rows={3} maxLength={300} />
          <label>Written by <span className="mut">(optional)</span></label><input name="author" defaultValue={a?.author} maxLength={80} placeholder="JAVS Editorial" />
        </div>
        <div className="stack">
          <ImageField name="coverUrl" label="Cover photo" folder="articles" initial={a?.coverUrl ?? ""} />
          <label>Story</label><textarea name="body" defaultValue={a?.body} rows={9} required minLength={20} maxLength={30000} placeholder="Leave a blank line between paragraphs." />
        </div>
      </div>
      {!a && <label className="mut" style={{ fontSize: ".9rem", textTransform: "none", letterSpacing: 0 }}><input type="checkbox" name="publish" style={{ width: "auto", marginRight: 8 }} />Publish now (leave unticked to save as a draft)</label>}
      <div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Saving…" : a ? "Save changes" : "Save story"}</button></div>
    </form>
  );
}

export default function ArticlesManager({ rows }: { rows: ArticleRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null), [adding, setAdding] = useState(!rows.length), [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null);
  const done = (m: Msg) => { setMsg(m); if (m?.ok) { setOpen(null); setAdding(false); router.refresh(); } };
  async function toggle(r: ArticleRow) {
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/articles", "PATCH", { id: r.id, publish: !r.publishedAt });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not update") });
    setMsg({ ok: true, text: r.publishedAt ? "Story unpublished. It is hidden from the site." : "Story published." }); router.refresh();
  }
  async function remove(r: ArticleRow) {
    if (!confirm(`Delete "${r.title}" and its comments for good? This cannot be undone.`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api(`/api/admin/articles?id=${encodeURIComponent(r.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not delete") });
    setMsg({ ok: true, text: "Story deleted." }); setOpen(null); router.refresh();
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Write a story</h2><button type="button" className="btn ghost sm" onClick={() => setAdding(!adding)} aria-expanded={adding}>{adding ? "Close" : "+ New story"}</button></div>
        {adding && <ArticleForm onDone={done} />}
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
      <section className="panel">
        <div className="panel-head"><h2>All stories</h2><span className="mut">{rows.length}</span></div>
        <ul className="ev-list">
          {rows.map(r => (
            <li key={r.id} className="ev">
              <div className="ev-row" style={{ gridTemplateColumns: "84px minmax(0,1fr) auto" }}>
                <div className="ev-thumb">{r.coverUrl ? <img src={r.coverUrl} alt="" loading="lazy" /> : <span>No photo</span>}</div>
                <div className="ev-main">
                  <b>{r.title}</b>
                  <small className="mut">{r.category} · {r.publishedAt ? `Published ${when(r.publishedAt)}` : "Not published"} · {r.comments} comment{r.comments === 1 ? "" : "s"}</small>
                  <div className="ev-chips"><span className={`badge ${r.publishedAt ? "red" : "amber"}`}>{r.publishedAt ? "Live" : "Draft"}</span></div>
                </div>
                <div className="ev-acts">
                  <button className={`btn sm${r.publishedAt ? " ghost" : ""}`} disabled={busy} onClick={() => toggle(r)}>{r.publishedAt ? "Unpublish" : "Publish"}</button>
                  <button className="btn ghost sm" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>{open === r.id ? "Close" : "Edit"}</button>
                </div>
              </div>
              {open === r.id && <div className="ev-more"><ArticleForm a={r} onDone={done} />
                <div className="adm-actions">{r.publishedAt && <a className="btn ghost sm" href={`/news/${r.slug}`} target="_blank" rel="noreferrer">View on site ↗</a>}<button type="button" className="btn ghost sm" disabled={busy} onClick={() => remove(r)}>Delete story</button></div></div>}
            </li>
          ))}
        </ul>
        {!rows.length && <p className="mut" style={{ margin: 0 }}>No stories yet. Write the first one above.</p>}
      </section>
    </>
  );
}
