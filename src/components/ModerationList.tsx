"use client";
import { useRouter } from "next/navigation";
type Item = { type: "submission" | "comment"; id: string; title: string; body: string };
export default function ModerationList({ items }: { items: Item[] }) {
  const r = useRouter();
  const act = async (i: Item, action: string) => { await fetch("/api/admin/moderate", { method: "POST", body: JSON.stringify({ type: i.type, id: i.id, action }) }); r.refresh(); };
  return <div>{items.map(i => <div key={i.id} className="card" style={{ marginBottom: 12 }}><small className="mut">{i.type}</small><h4>{i.title}</h4><p>{i.body}</p><button className="btn" onClick={() => act(i, "approve")}>Approve</button> <button className="btn" style={{ background: "#171717" }} onClick={() => act(i, "reject")}>Reject</button></div>)}{!items.length && <p className="mut">Nothing waiting for review.</p>}</div>;
}
