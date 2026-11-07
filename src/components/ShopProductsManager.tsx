"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import { api, errText, type Msg } from "@/lib/admin-fetch";
import { BRAND_LABEL, COLORS, KIND_LABEL, SIZES, stockKey } from "@/lib/shop-constants";
import { ksh } from "@/lib/format";

export type PRow = { id: string; name: string; brand: string; kind: string; description: string; priceKes: number; imageUrl: string | null; active: boolean; stock: Record<string, number> };
type Kind = "TSHIRT" | "HOODIE" | "CAP" | "ARMBAND";
const BLANK: PRow = { id: "", name: "", brand: "KIBURI_NATION", kind: "TSHIRT", description: "", priceKes: 0, imageUrl: null, active: true, stock: {} };

function ProductForm({ row, onDone }: { row: PRow; onDone: () => void }) {
  const router = useRouter(), editing = !!row.id;
  const [f, setF] = useState({ name: row.name, brand: row.brand, kind: row.kind as Kind, description: row.description, price: row.priceKes ? String(row.priceKes) : "", active: row.active });
  const [stock, setStock] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(row.stock).map(([k, v]) => [k, String(v)])));
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null);
  const sizes = SIZES[f.kind];
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = {
      name: f.name, brand: f.brand, kind: f.kind, description: f.description, priceKes: Number(f.price), active: f.active, imageUrl: String(new FormData(e.currentTarget).get("imageUrl") ?? ""),
      stock: Object.fromEntries(COLORS.flatMap(c => sizes.map(s => [stockKey(c, s), stock[stockKey(c, s)]] as const)).filter(([, v]) => v !== undefined && v.trim() !== "").map(([k, v]) => [k, Math.max(0, Math.floor(Number(v)) || 0)])),
    };
    setBusy(true); setMsg(null);
    const { ok, j } = await api(editing ? `/api/admin/shop/products/${row.id}` : "/api/admin/shop/products", editing ? "PATCH" : "POST", body);
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not save") });
    router.refresh(); onDone();
  }
  return (
    <form onSubmit={save} className="panel" style={{ border: "1px solid var(--red)" }}>
      <div className="panel-head"><h2>{editing ? `Edit ${row.name}` : "New product"}</h2><button type="button" className="btn ghost sm" onClick={onDone}>Cancel</button></div>
      <label>Name<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required minLength={2} maxLength={80} placeholder="e.g. Classic logo tee" /></label>
      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
        <label>Collection<select value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })}>{Object.entries(BRAND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Type<select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as Kind })}>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Price (KSh)<input type="number" min={1} step={1} value={f.price} onChange={e => setF({ ...f, price: e.target.value })} required /></label>
      </div>
      <label>Description (optional)<textarea rows={4} maxLength={2000} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} placeholder="Fabric, fit, what makes it special…" /></label>
      <ImageField key={row.id || "new"} name="imageUrl" label="Product photo" folder="shop" initial={row.imageUrl ?? ""} />
      <p style={{ marginBottom: 4 }}><b>Stock</b> <span className="mut">(how many you have of each colour{sizes.length > 1 ? " and size" : ""}; leave blank if you don't offer it)</span></p>
      <div style={{ overflowX: "auto" }}>
        <table className="tbl"><thead><tr><th>Colour</th>{sizes.map(s => <th key={s}>{s}</th>)}</tr></thead><tbody>
          {COLORS.map(c => <tr key={c}><td><b>{c}</b></td>{sizes.map(s => <td key={s}><input type="number" min={0} step={1} style={{ width: 72, margin: 0 }} value={stock[stockKey(c, s)] ?? ""} placeholder="–" aria-label={`${c} ${s} stock`} onChange={e => setStock({ ...stock, [stockKey(c, s)]: e.target.value })} /></td>)}</tr>)}
        </tbody></table>
      </div>
      <label style={{ display: "block", margin: "12px 0" }}><input type="checkbox" checked={f.active} onChange={e => setF({ ...f, active: e.target.checked })} /> Show in the shop</label>
      <div className="adm-actions"><button className="btn" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>{msg && <span role="alert" style={{ color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</span>}</div>
    </form>
  );
}

export default function ShopProductsManager({ products, deliveryFee }: { products: PRow[]; deliveryFee: number | null }) {
  const router = useRouter();
  const [edit, setEdit] = useState<PRow | null>(null), [fee, setFee] = useState(deliveryFee === null ? "" : String(deliveryFee)), [msg, setMsg] = useState<Msg>(null);
  async function saveFee(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const { ok, j } = await api("/api/admin/shop/settings", "PATCH", { deliveryFeeKes: fee.trim() === "" ? null : Number(fee) });
    setMsg(ok ? { ok: true, text: fee.trim() === "" ? "Delivery is off. Customers can only choose pickup." : "Delivery fee saved." } : { ok: false, text: errText(j, "Could not save") }); if (ok) router.refresh();
  }
  async function remove(p: PRow) {
    if (!confirm(`Delete "${p.name}"? Past orders keep their own record of it.`)) return;
    const { ok, j } = await api(`/api/admin/shop/products/${p.id}`, "DELETE");
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not delete") });
    router.refresh();
  }
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {edit && <ProductForm key={edit.id || "new"} row={edit} onDone={() => setEdit(null)} />}
      <div className="adm-actions" style={{ margin: 0 }}><button className="btn" onClick={() => setEdit(BLANK)}>+ New product</button><span className="mut">{products.length} products</span></div>
      <section className="panel">
        {products.length ? <table className="tbl"><thead><tr><th></th><th>Product</th><th>Price</th><th>In stock</th><th>Status</th><th></th></tr></thead><tbody>{products.map(p => (
          <tr key={p.id}><td style={{ width: 64 }}>{p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} /> : null}</td>
            <td><b>{p.name}</b><br /><small className="mut">{BRAND_LABEL[p.brand]} · {KIND_LABEL[p.kind]}</small></td><td>{ksh(p.priceKes)}</td>
            <td>{Object.values(p.stock).reduce((s, n) => s + n, 0)}</td><td><span className={`st ${p.active ? "st-success" : ""}`}>{p.active ? "Live" : "Hidden"}</span></td>
            <td><div className="adm-actions" style={{ margin: 0, justifyContent: "flex-end" }}><button className="btn sm" onClick={() => setEdit(p)}>Edit</button><button className="btn ghost sm" onClick={() => remove(p)}>Delete</button></div></td></tr>))}</tbody></table>
          : <p className="mut" style={{ margin: 0 }}>No products yet. Add your first one above.</p>}
      </section>
      <form onSubmit={saveFee} className="panel"><div className="panel-head"><h2>Delivery</h2></div>
        <label>Delivery fee (KSh). Leave empty for pickup only.<input type="number" min={0} step={1} value={fee} onChange={e => setFee(e.target.value)} placeholder="Pickup only" style={{ maxWidth: 220 }} /></label>
        <div className="adm-actions"><button className="btn sm">Save</button>{msg && <span role="status" style={{ color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</span>}</div>
      </form>
    </div>
  );
}
