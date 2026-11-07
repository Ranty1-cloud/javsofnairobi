"use client";
import TripTypeFields from "./TripTypeFields";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import PlaceFields from "./PlaceFields";
import { api, errText, fromNairobiInput, type Msg } from "@/lib/admin-fetch";

const KINDS = ["Road trip", "Nganya event", "Resort getaway", "Hike", "Night adventure", "Beach trip", "Day tour"];
export default function NewEventForm({ vehicles }: { vehicles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), s = (k: string) => String(f.get(k) ?? "").trim(), n = (k: string) => (s(k) ? Number(s(k)) : undefined);
    const body: Record<string, unknown> = {
      title: s("title"), category: s("category"), county: s("county"), town: s("town"), vehicleId: s("vehicleId"), departsAt: fromNairobiInput(s("departsAt")),
      meetingPoint: s("meetingPoint"), tripType: s("tripType"), priceKes: n("priceKes"), bookingFeeKes: n("bookingFeeKes") ?? 0, published: f.get("published") === "on",
    };
    if (s("durationLabel")) body.durationLabel = s("durationLabel");
    if (s("summary")) body.summary = s("summary");
    if (s("imageUrl")) body.imageUrl = s("imageUrl");
    if (n("premiumPriceKes")) body.premiumPriceKes = n("premiumPriceKes");
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/trips", "POST", body);
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not create the event. Check every field.") });
    router.push("/admin/events");
  }
  return (
    <form onSubmit={go} className="panel ev-edit stack" style={{ maxWidth: 860 }}>
      <div className="ev-cols">
        <div className="stack">
          <label htmlFor="ne-title">Event name</label><input id="ne-title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Naivasha Weekend Escape" />
          <label htmlFor="ne-cat">What kind of event</label><input id="ne-cat" name="category" required minLength={2} maxLength={60} list="kinds" placeholder="Pick or type your own" /><datalist id="kinds">{KINDS.map(k => <option key={k} value={k} />)}</datalist>
          <PlaceFields />
          <label htmlFor="ne-mp">Meeting point</label><input id="ne-mp" name="meetingPoint" required minLength={2} maxLength={160} placeholder="e.g. Kencom, Nairobi CBD" />
          <label htmlFor="ne-dep">Departure (Nairobi time)</label><input id="ne-dep" name="departsAt" type="datetime-local" required />
          <TripTypeFields idPrefix="ne" defaultType="DAY" defaultDuration="" optional placeholder="e.g. 2 days, 1 night" />
        </div>
        <div className="stack">
          <label htmlFor="ne-veh">Vehicle (sets the seat layout)</label>
          <select id="ne-veh" name="vehicleId" required defaultValue=""><option value="" disabled>Choose a vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
          <label htmlFor="ne-price">Seat price (KSh)</label><input id="ne-price" name="priceKes" type="number" min={1} step={1} required placeholder="e.g. 2500" inputMode="numeric" />
          <label htmlFor="ne-prem">Front-row seat price (KSh) <span className="mut">(optional)</span></label><input id="ne-prem" name="premiumPriceKes" type="number" min={1} step={1} inputMode="numeric" />
          <label htmlFor="ne-fee">Booking fee per booking (KSh)</label><input id="ne-fee" name="bookingFeeKes" type="number" min={0} step={1} defaultValue={0} inputMode="numeric" />
          <ImageField name="imageUrl" label="Cover photo" folder="trips" />
          <label htmlFor="ne-sum">Short description <span className="mut">(optional)</span></label><textarea id="ne-sum" name="summary" rows={4} maxLength={600} placeholder="What makes this trip worth booking?" />
        </div>
      </div>
      <label className="mut" style={{ fontSize: ".9rem", textTransform: "none", letterSpacing: 0 }}><input type="checkbox" name="published" style={{ width: "auto", marginRight: 8 }} />Publish now (leave unticked to save it as a draft)</label>
      <p className="note" style={{ margin: 0 }}>Seat prices are fixed once the event is created. Seats are generated from the vehicle layout.</p>
      {msg && <p role="alert" style={{ margin: 0, color: "#ff6b73" }}>{msg.text}</p>}
      <div className="adm-actions"><button className="btn" disabled={busy}>{busy ? "Creating…" : "Create event"}</button></div>
    </form>
  );
}
