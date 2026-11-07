"use client";
import { useRouter } from "next/navigation";
type P = { id: string; reference: string; amount: number; code: string | null; payerName: string | null; account: string | null; passengers: string[]; phone: string | null; created: string };
export default function PaymentsList({ items }: { items: P[] }) {
  const r = useRouter();
  const act = async (id: string, action: string) => { if (action === "confirm" && !confirm("Confirm you have seen this exact name, amount and code in your M-Pesa statement?")) return; await fetch("/api/admin/payments/verify", { method: "POST", body: JSON.stringify({ paymentId: id, action }) }); r.refresh(); };
  return <div>{items.map(i => <div key={i.id} className="card" style={{ marginBottom: 12 }}>
    <h4>{i.reference}: KSh {i.amount.toLocaleString()}</h4>
    <p style={{ margin: "6px 0" }}>Name on M-Pesa: {i.payerName ? <b style={{ fontSize: "1.1rem", letterSpacing: ".04em" }}>{i.payerName.toUpperCase()}</b> : <span className="mut">none given (submitted before names were required)</span>}</p>
    <p style={{ margin: "6px 0" }}>Code submitted: <b>{i.code ?? "none yet"}</b></p>
    <p className="mut" style={{ margin: "6px 0" }}>{i.phone} · {new Date(i.created).toLocaleString("en-KE")}</p>
    <p className="mut" style={{ margin: "6px 0", fontSize: ".85rem" }}>Booked by {i.account ?? "guest"}{i.passengers.length > 0 && <> · Passengers: {i.passengers.join(", ")}</>}</p>
    <button className="btn" onClick={() => act(i.id, "confirm")}>Confirm paid</button> <button className="btn" style={{ background: "#171717" }} onClick={() => act(i.id, "reject")}>Reject</button></div>)}{!items.length && <p className="mut">No manual payments waiting.</p>}</div>;
}
