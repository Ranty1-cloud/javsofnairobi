"use client";
import { useRouter } from "next/navigation";
type P = { id: string; reference: string; amount: number; code: string | null; phone: string | null; created: string };
export default function PaymentsList({ items }: { items: P[] }) {
  const r = useRouter();
  const act = async (id: string, action: string) => { if (action === "confirm" && !confirm("Confirm you have seen this exact amount and code in your M-Pesa statement?")) return; await fetch("/api/admin/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: id, action }) }); r.refresh(); };
  return <div>{items.map(i => <div key={i.id} className="card" style={{ marginBottom: 12 }}><h4>{i.reference}: KSh {i.amount.toLocaleString()}</h4><p className="mut">{i.phone} · {new Date(i.created).toLocaleString("en-KE")}</p><p>Code submitted: <b>{i.code ?? "none yet"}</b></p><button className="btn" onClick={() => act(i.id, "confirm")}>Confirm paid</button> <button className="btn" style={{ background: "#171717" }} onClick={() => act(i.id, "reject")}>Reject</button></div>)}{!items.length && <p className="mut">No manual payments waiting.</p>}</div>;
}
