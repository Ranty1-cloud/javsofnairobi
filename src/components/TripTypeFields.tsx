"use client";
import { useState } from "react";

// Trip type + duration, with a warning when they contradict each other (e.g. "Day trip" with "1 night").
export default function TripTypeFields({ idPrefix, defaultType, defaultDuration, placeholder, optional }: { idPrefix?: string; defaultType: string; defaultDuration: string; placeholder: string; optional?: boolean }) {
  const [type, setType] = useState(defaultType), [dur, setDur] = useState(defaultDuration);
  const id = (s: string) => (idPrefix ? `${idPrefix}-${s}` : undefined);
  return (
    <>
      <label htmlFor={id("type")}>Trip type</label>
      <select id={id("type")} name="tripType" value={type} onChange={e => setType(e.target.value)}><option value="DAY">Day trip</option><option value="OVERNIGHT">Overnight</option><option value="WEEKEND">Weekend</option></select>
      <label htmlFor={id("dur")}>Duration{optional && <span className="mut"> (optional)</span>}</label>
      <input id={id("dur")} name="durationLabel" value={dur} onChange={e => setDur(e.target.value)} maxLength={60} placeholder={placeholder} />
      {type === "DAY" && /night/i.test(dur) && <p className="note" role="status" style={{ margin: 0 }}>A day trip doesn&apos;t have a night. Choose <b>Overnight</b> or <b>Weekend</b>, or change the duration.</p>}
    </>
  );
}
